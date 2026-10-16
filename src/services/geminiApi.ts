import type { InterviewConfig } from '../types/interview'
import type {
  AnswerEvaluation,
  GeneratedQuestionPayload,
  FinalSummaryPayload,
} from '../types/gemini'

const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? ''

export class GeminiApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message)
    this.name = 'GeminiApiError'
  }
}

function apiUrl(path: string): string {
  if (!baseUrl) {
    throw new GeminiApiError(
      'VITE_API_URL is not set. Add it to .env.local (e.g. http://localhost:8000).',
    )
  }
  return `${baseUrl}${path}`
}

function toContextBody(config: InterviewConfig) {
  return {
    job_role: config.jobRole,
    experience_level: config.experienceLevel,
    interview_type: config.interviewCategory,
    difficulty: config.difficulty,
    question_count: config.questionCount,
    candidate_name: config.candidateName,
    job_description: config.jobDescription ?? null,
    resume_excerpt: config.resumeExcerpt ?? null,
  }
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  let response: Response
  try {
    response = await fetch(apiUrl(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new GeminiApiError(
      'Could not reach the interview API. Is the FastAPI server running?',
    )
  }

  const data = (await response.json().catch(() => ({}))) as {
    detail?: string | { msg?: string }[]
  }

  if (!response.ok) {
    let detail = 'Request failed.'
    if (typeof data.detail === 'string') detail = data.detail
    else if (Array.isArray(data.detail) && data.detail[0]?.msg) {
      detail = data.detail[0].msg
    }
    throw new GeminiApiError(detail, response.status)
  }

  return data as T
}

export async function generateInterviewQuestions(
  config: InterviewConfig,
): Promise<GeneratedQuestionPayload[]> {
  const data = await postJson<{ questions: GeneratedQuestionPayload[] }>(
    '/api/interview/generate-questions',
    toContextBody(config),
  )
  return data.questions
}

export async function evaluateAnswerApi(
  config: InterviewConfig,
  questionPrompt: string,
  candidateAnswer: string,
): Promise<AnswerEvaluation> {
  const data = await postJson<AnswerEvaluation>('/api/interview/evaluate-answer', {
    context: toContextBody(config),
    question_prompt: questionPrompt,
    candidate_answer: candidateAnswer,
  })
  return data
}

export async function requestFollowUpApi(
  config: InterviewConfig,
  questionPrompt: string,
  candidateAnswer: string,
  questionIndex: number,
): Promise<{ should_ask_follow_up: boolean; follow_up: GeneratedQuestionPayload | null }> {
  return postJson('/api/interview/follow-up', {
    context: toContextBody(config),
    question_prompt: questionPrompt,
    candidate_answer: candidateAnswer,
    question_index: questionIndex,
  })
}

export async function fetchFinalSummaryApi(
  config: InterviewConfig,
  qaPairs: { question: string; answer: string }[],
): Promise<FinalSummaryPayload> {
  return postJson('/api/interview/final-summary', {
    context: toContextBody(config),
    qa_pairs: qaPairs,
  })
}

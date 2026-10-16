import { supabase } from '../lib/supabase'
import type { InterviewConfig, InterviewQuestion } from '../types/interview'
import type { DemoResults } from '../types/interview'
import type { DbInterview, DbInterviewResult } from '../types/database'
import type { GeneratedQuestionPayload } from '../types/gemini'

export class InterviewServiceError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message)
    this.name = 'InterviewServiceError'
  }
}

function mapQuestions(rows: {
  id: string
  category: string
  prompt: string
  hint: string | null
  question_order: number
}[]): InterviewQuestion[] {
  return rows
    .sort((a, b) => a.question_order - b.question_order)
    .map((row) => ({
      id: row.id,
      category: row.category,
      prompt: row.prompt,
      hint: row.hint ?? undefined,
    }))
}

export async function createInterviewRecord(
  userId: string,
  config: InterviewConfig,
): Promise<string> {
  const { data: interview, error } = await supabase
    .from('interviews')
    .insert({
      user_id: userId,
      job_role: config.jobRole,
      experience_level: config.experienceLevel,
      interview_type: config.interviewType,
      difficulty: config.difficulty,
      status: 'in_progress',
    })
    .select('id')
    .single()

  if (error || !interview) {
    throw new InterviewServiceError(
      'Could not create interview session. Check that the database migration has been run.',
      error,
    )
  }

  return interview.id as string
}

export async function insertGeneratedQuestions(
  interviewId: string,
  generated: GeneratedQuestionPayload[],
): Promise<InterviewQuestion[]> {
  const questionRows = generated.map((q, index) => ({
    interview_id: interviewId,
    question_order: index,
    category: q.category,
    prompt: q.prompt,
    hint: q.hint ?? null,
  }))

  const { data: insertedQuestions, error } = await supabase
    .from('interview_questions')
    .insert(questionRows)
    .select('id, category, prompt, hint, question_order')

  if (error || !insertedQuestions?.length) {
    throw new InterviewServiceError(
      'Interview was created but questions could not be saved.',
      error,
    )
  }

  return mapQuestions(insertedQuestions)
}

export async function appendInterviewQuestion(
  interviewId: string,
  order: number,
  question: GeneratedQuestionPayload,
): Promise<InterviewQuestion> {
  const { data, error } = await supabase
    .from('interview_questions')
    .insert({
      interview_id: interviewId,
      question_order: order,
      category: question.category,
      prompt: question.prompt,
      hint: question.hint ?? null,
    })
    .select('id, category, prompt, hint, question_order')
    .single()

  if (error || !data) {
    throw new InterviewServiceError('Could not save follow-up question.', error)
  }

  return {
    id: data.id,
    category: data.category,
    prompt: data.prompt,
    hint: data.hint ?? undefined,
    isFollowUp: true,
  }
}

export async function upsertAnswer(
  interviewId: string,
  questionId: string,
  answerText: string,
  feedback?: string,
): Promise<void> {
  const { error } = await supabase.from('interview_answers').upsert(
    {
      interview_id: interviewId,
      question_id: questionId,
      answer_text: answerText,
      ...(feedback !== undefined ? { feedback } : {}),
    },
    { onConflict: 'question_id' },
  )

  if (error) {
    throw new InterviewServiceError('Could not save your answer.', error)
  }
}

export async function completeInterviewSession(
  interviewId: string,
  results: DemoResults,
  options: { summary: string; isIllustrative: boolean },
): Promise<DbInterviewResult> {
  const { error: statusError } = await supabase
    .from('interviews')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', interviewId)

  if (statusError) {
    throw new InterviewServiceError('Could not mark interview as completed.', statusError)
  }

  const { data, error } = await supabase
    .from('interview_results')
    .upsert(
      {
        interview_id: interviewId,
        overall_score: results.overallScore,
        category_scores: results.categories,
        strengths: results.strengths,
        improvements: results.improvements,
        recommendations: results.recommendations,
        summary: options.summary,
        is_illustrative: options.isIllustrative,
      },
      { onConflict: 'interview_id' },
    )
    .select()
    .single()

  if (error || !data) {
    throw new InterviewServiceError('Could not save interview results.', error)
  }

  return data as DbInterviewResult
}

export async function loadInterviewSession(interviewId: string): Promise<{
  interview: DbInterview
  questions: InterviewQuestion[]
  answers: Record<string, string>
}> {
  const { data: interview, error: interviewError } = await supabase
    .from('interviews')
    .select('*')
    .eq('id', interviewId)
    .single()

  if (interviewError || !interview) {
    throw new InterviewServiceError('Interview not found.', interviewError)
  }

  const { data: questionRows, error: qError } = await supabase
    .from('interview_questions')
    .select('id, category, prompt, hint, question_order')
    .eq('interview_id', interviewId)

  if (qError || !questionRows) {
    throw new InterviewServiceError('Could not load questions.', qError)
  }

  const { data: answerRows, error: aError } = await supabase
    .from('interview_answers')
    .select('question_id, answer_text')
    .eq('interview_id', interviewId)

  if (aError) {
    throw new InterviewServiceError('Could not load answers.', aError)
  }

  const answers: Record<string, string> = {}
  for (const row of answerRows ?? []) {
    answers[row.question_id] = row.answer_text
  }

  return {
    interview: interview as DbInterview,
    questions: mapQuestions(questionRows),
    answers,
  }
}

export async function fetchInterviewResult(
  interviewId: string,
): Promise<DbInterviewResult | null> {
  const { data, error } = await supabase
    .from('interview_results')
    .select('*')
    .eq('interview_id', interviewId)
    .maybeSingle()

  if (error) {
    throw new InterviewServiceError('Could not load results.', error)
  }

  return data as DbInterviewResult | null
}

export function dbResultToDemoResults(row: DbInterviewResult): DemoResults {
  return {
    overallScore: row.overall_score,
    categories: Array.isArray(row.category_scores) ? row.category_scores : [],
    strengths: row.strengths ?? [],
    improvements: row.improvements ?? [],
    recommendations: row.recommendations ?? [],
    summary: row.summary ?? undefined,
  }
}

export function finalSummaryToDemoResults(payload: {
  overall_score: number
  category_scores: { label: string; score: number }[]
  strengths: string[]
  improvement_areas: string[]
  next_steps: string[]
  summary: string
}): DemoResults {
  return {
    overallScore: payload.overall_score,
    categories: payload.category_scores,
    strengths: payload.strengths,
    improvements: payload.improvement_areas,
    recommendations: payload.next_steps,
    summary: payload.summary,
  }
}

export interface GeneratedQuestionPayload {
  category: string
  prompt: string
  hint?: string | null
}

export interface AnswerEvaluation {
  score: number
  strengths: string[]
  weaknesses: string[]
  clarity_score: number
  technical_accuracy_score: number
  improvement_suggestions: string[]
  summary_feedback: string
}

export interface FinalSummaryPayload {
  overall_score: number
  category_scores: { label: string; score: number }[]
  strengths: string[]
  improvement_areas: string[]
  next_steps: string[]
  summary: string
}

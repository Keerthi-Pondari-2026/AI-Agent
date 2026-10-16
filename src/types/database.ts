export type InterviewStatus = 'draft' | 'in_progress' | 'completed' | 'cancelled'

export interface DbProfile {
  id: string
  display_name: string | null
  created_at: string
  updated_at: string
}

export interface DbInterview {
  id: string
  user_id: string
  job_role: string
  experience_level: string
  interview_type: string
  difficulty: string
  status: InterviewStatus
  created_at: string
  updated_at: string
  completed_at: string | null
}

export interface DbInterviewQuestion {
  id: string
  interview_id: string
  question_order: number
  category: string
  prompt: string
  hint: string | null
  created_at: string
}

export interface DbInterviewAnswer {
  id: string
  interview_id: string
  question_id: string
  answer_text: string
  feedback: string | null
  created_at: string
  updated_at: string
}

export interface DbInterviewResult {
  id: string
  interview_id: string
  overall_score: number
  category_scores: { label: string; score: number }[]
  strengths: string[]
  improvements: string[]
  recommendations: string[]
  summary: string | null
  question_feedback?: {
    question: string
    score: number
    feedback: string
    example_improvement?: string
  }[]
  study_topics?: string[]
  is_illustrative: boolean
  created_at: string
}

export type ExperienceLevel =
  | 'fresher'
  | 'entry'
  | 'experienced'
  | 'junior'
  | 'mid'
  | 'senior'
  | 'lead'

export type InterviewCategory =
  | 'technical'
  | 'hr'
  | 'aptitude'
  | 'logical-reasoning'
  | 'mixed'
  | 'behavioral'
  | 'system-design'

export type Difficulty = 'easy' | 'medium' | 'hard'
export type QuestionCount = 5 | 10 | 15

/** @deprecated use interviewCategory — kept for DB compatibility */
export type InterviewType = InterviewCategory

export interface InterviewConfig {
  candidateName: string
  jobRole: string
  experienceLevel: ExperienceLevel
  interviewCategory: InterviewCategory
  difficulty: Difficulty
  questionCount: QuestionCount
  jobDescription?: string
  resumeExcerpt?: string
}

export interface InterviewQuestion {
  id: string
  category: string
  prompt: string
  hint?: string
  isFollowUp?: boolean
}

export interface RecentInterview {
  id: string
  role: string
  type: InterviewCategory
  date: string
  score: number
  status: 'completed' | 'in-progress'
}

export interface QuestionFeedbackItem {
  question: string
  score: number
  feedback: string
  exampleImprovement?: string
}

export interface DemoResults {
  overallScore: number
  categories: { label: string; score: number }[]
  strengths: string[]
  improvements: string[]
  recommendations: string[]
  studyTopics?: string[]
  questionFeedback?: QuestionFeedbackItem[]
  summary?: string
}

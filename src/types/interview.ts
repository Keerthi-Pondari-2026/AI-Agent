export type ExperienceLevel = 'junior' | 'mid' | 'senior' | 'lead'
export type InterviewType = 'technical' | 'behavioral' | 'system-design' | 'mixed'
export type Difficulty = 'easy' | 'medium' | 'hard'

export interface InterviewConfig {
  jobRole: string
  experienceLevel: ExperienceLevel
  interviewType: InterviewType
  difficulty: Difficulty
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
  type: InterviewType
  date: string
  score: number
  status: 'completed' | 'in-progress'
}

export interface DemoResults {
  overallScore: number
  categories: { label: string; score: number }[]
  strengths: string[]
  improvements: string[]
  recommendations: string[]
  summary?: string
}

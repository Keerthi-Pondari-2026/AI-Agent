import type { InterviewQuestion, RecentInterview } from '../types/interview'

export const dashboardStats = {
  interviewsCompleted: 12,
  averageScore: 78,
  practiceHours: 14.5,
  streakDays: 5,
}

export const recentInterviews: RecentInterview[] = [
  {
    id: '1',
    role: 'Frontend Engineer',
    type: 'technical',
    date: 'Oct 14, 2026',
    score: 82,
    status: 'completed',
  },
  {
    id: '2',
    role: 'Product Manager',
    type: 'behavioral',
    date: 'Oct 12, 2026',
    score: 74,
    status: 'completed',
  },
  {
    id: '3',
    role: 'Full Stack Developer',
    type: 'mixed',
    date: 'Oct 10, 2026',
    score: 71,
    status: 'completed',
  },
  {
    id: '4',
    role: 'Staff Engineer',
    type: 'system-design',
    date: 'Oct 8, 2026',
    score: 68,
    status: 'completed',
  },
]

const questionBank: InterviewQuestion[] = [
  {
    id: 'q1',
    category: 'Technical',
    prompt:
      'Walk me through how you would optimize the perceived performance of a React application that loads a large data table.',
    hint: 'Consider virtualization, memoization, and network strategy.',
  },
  {
    id: 'q2',
    category: 'Technical',
    prompt:
      'Explain the difference between controlled and uncontrolled components in React. When would you choose each?',
  },
  {
    id: 'q3',
    category: 'Behavioral',
    prompt:
      'Tell me about a time you disagreed with a teammate on a technical approach. How did you resolve it?',
    hint: 'Use STAR: Situation, Task, Action, Result.',
  },
  {
    id: 'q4',
    category: 'Problem Solving',
    prompt:
      'How would you design a rate limiter for a public API? Describe the trade-offs of your approach.',
  },
  {
    id: 'q5',
    category: 'Behavioral',
    prompt:
      'Describe a project where you had to learn a new technology quickly. What was your learning strategy?',
  },
]

export function getQuestionsForSession(
  interviewType: string,
  difficulty: string,
): InterviewQuestion[] {
  const count = difficulty === 'hard' ? 5 : difficulty === 'easy' ? 3 : 4
  const filtered =
    interviewType === 'behavioral'
      ? questionBank.filter((q) => q.category === 'Behavioral')
      : interviewType === 'technical'
        ? questionBank.filter((q) => q.category !== 'Behavioral')
        : questionBank

  const pool = filtered.length >= count ? filtered : questionBank
  return pool.slice(0, count)
}

export const illustrativeResults = {
  overallScore: 76,
  categories: [
    { label: 'Communication', score: 82 },
    { label: 'Technical depth', score: 74 },
    { label: 'Structure & clarity', score: 79 },
    { label: 'Problem solving', score: 71 },
  ],
  strengths: [
    'Clear explanations with concrete examples from past projects',
    'Good use of trade-off language when discussing architecture',
    'Confident pacing and professional tone throughout',
  ],
  improvements: [
    'Quantify impact more often (metrics, latency, user outcomes)',
    'Go deeper on edge cases when discussing system design',
    'Summarize key takeaways at the end of longer answers',
  ],
  recommendations: [
    'Practice 2-minute structured answers using STAR for behavioral questions',
    'Review one system-design pattern per week (caching, queues, idempotency)',
    'Record yourself answering technical prompts and review for filler words',
  ],
}

export const jobRoleSuggestions = [
  'Frontend Engineer',
  'Backend Engineer',
  'Full Stack Developer',
  'Data Scientist',
  'Product Manager',
  'DevOps Engineer',
]

import { supabase } from '../lib/supabase'
import type { RecentInterview } from '../types/interview'
import type { InterviewType } from '../types/interview'

export interface DashboardMetrics {
  interviewsCompleted: number
  averageScore: number | null
  practiceHours: number | null
  streakDays: number
}

export class DashboardServiceError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message)
    this.name = 'DashboardServiceError'
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function computeStreak(completedDates: string[]): number {
  if (completedDates.length === 0) return 0

  const days = new Set(
    completedDates.map((d) => new Date(d).toISOString().slice(0, 10)),
  )
  let streak = 0
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)

  while (true) {
    const key = cursor.toISOString().slice(0, 10)
    if (!days.has(key)) break
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export async function fetchDashboardData(userId: string): Promise<{
  metrics: DashboardMetrics
  recent: RecentInterview[]
}> {
  const { data: interviews, error: interviewsError } = await supabase
    .from('interviews')
    .select('id, job_role, interview_type, status, created_at, completed_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (interviewsError) {
    throw new DashboardServiceError(
      'Could not load interviews. Run the SQL migration in Supabase if tables are missing.',
      interviewsError,
    )
  }

  const list = interviews ?? []
  const completed = list.filter((i) => i.status === 'completed')
  const completedIds = completed.map((i) => i.id)

  let averageScore: number | null = null
  const scoreByInterview = new Map<string, number>()

  if (completedIds.length > 0) {
    const { data: results, error: resultsError } = await supabase
      .from('interview_results')
      .select('interview_id, overall_score')
      .in('interview_id', completedIds)

    if (resultsError) {
      throw new DashboardServiceError('Could not load interview scores.', resultsError)
    }

    for (const row of results ?? []) {
      scoreByInterview.set(row.interview_id, row.overall_score)
    }

    const scores = [...scoreByInterview.values()]
    if (scores.length > 0) {
      averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    }
  }

  let practiceHours: number | null = null
  const durations = completed
    .filter((i) => i.completed_at)
    .map(
      (i) =>
        (new Date(i.completed_at!).getTime() - new Date(i.created_at).getTime()) /
        1000 /
        3600,
    )
  if (durations.length > 0) {
    practiceHours = Math.round(durations.reduce((a, b) => a + b, 0) * 10) / 10
  }

  const streakDays = computeStreak(
    completed.map((i) => i.completed_at ?? i.created_at),
  )

  const recent: RecentInterview[] = list.slice(0, 8).map((i) => ({
    id: i.id,
    role: i.job_role,
    type: i.interview_type as InterviewType,
    date: formatDate(i.completed_at ?? i.created_at),
    score: scoreByInterview.get(i.id) ?? 0,
    status: i.status === 'completed' ? 'completed' : 'in-progress',
  }))

  return {
    metrics: {
      interviewsCompleted: completed.length,
      averageScore,
      practiceHours,
      streakDays,
    },
    recent,
  }
}

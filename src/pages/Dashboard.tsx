import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Calendar,
  Flame,
  Loader2,
  Play,
  Target,
  TrendingUp,
} from 'lucide-react'
import { StatCard } from '../components/StatCard'
import {
  DashboardServiceError,
  fetchDashboardData,
  type DashboardMetrics,
} from '../services/dashboardService'
import { useAuth } from '../context/AuthContext'
import type { RecentInterview } from '../types/interview'
import { dashboardStats, recentInterviews as demoRecentInterviews } from '../data/mockData'

const typeLabels: Record<string, string> = {
  technical: 'Technical',
  behavioral: 'Behavioral',
  'system-design': 'System design',
  mixed: 'Mixed',
}

export function Dashboard() {
  const { user, isDemoMode, displayName } = useAuth()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [recent, setRecent] = useState<RecentInterview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isDemoMode) {
      setMetrics({
        interviewsCompleted: dashboardStats.interviewsCompleted,
        averageScore: dashboardStats.averageScore,
        practiceHours: dashboardStats.practiceHours,
        streakDays: dashboardStats.streakDays,
      })
      setRecent(demoRecentInterviews)
      setLoading(false)
      setError(null)
      return
    }

    if (!user) return

    let cancelled = false
    setLoading(true)
    setError(null)

    fetchDashboardData(user.id)
      .then((data) => {
        if (cancelled) return
        setMetrics(data.metrics)
        setRecent(data.recent)
      })
      .catch((err) => {
        if (cancelled) return
        const message =
          err instanceof DashboardServiceError
            ? err.message
            : 'Could not load dashboard data from Supabase.'
        setError(message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user, isDemoMode])

  return (
    <div className="animate-fade-in space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-accent-purple">Welcome back</p>
          <h1 className="font-display text-3xl text-navy sm:text-4xl text-balance">
            Hi {displayName} — ready to practice?
          </h1>
          <p className="mt-2 max-w-xl text-navy-muted">
            {isDemoMode
              ? 'Illustrative dashboard sample for presentations. Live data appears when you sign in with Supabase.'
              : 'Your interviews and scores are stored in Supabase. Question prompts still come from the bundled practice bank until Gemini is connected.'}
          </p>
        </div>
        <Link
          to="/setup"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-violet to-accent-purple px-5 py-3 text-sm font-semibold text-white shadow-glow transition hover:opacity-95 active:scale-[0.98]"
        >
          <Play className="h-4 w-4" aria-hidden />
          Start interview
        </Link>
      </header>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900" role="alert">
          <p className="font-semibold">Could not load dashboard</p>
          <p className="mt-1">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-navy-muted">
          <Loader2 className="h-6 w-6 animate-spin text-accent-purple" aria-hidden />
          {isDemoMode ? 'Loading demo dashboard…' : 'Loading your stats from Supabase…'}
        </div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Interviews completed"
              value={metrics?.interviewsCompleted ?? 0}
              subtext={isDemoMode ? 'Illustrative sample' : 'From your account'}
              icon={Calendar}
              delay={50}
            />
            <StatCard
              label="Average score"
              value={
                metrics?.averageScore != null ? `${metrics.averageScore}%` : '—'
              }
              subtext={isDemoMode ? 'Demo metric' : 'Completed sessions only'}
              icon={Target}
              delay={100}
            />
            <StatCard
              label="Practice time"
              value={
                metrics?.practiceHours != null ? `${metrics.practiceHours}h` : '—'
              }
              subtext={isDemoMode ? 'Demo metric' : 'Sum of session durations'}
              icon={TrendingUp}
              delay={150}
            />
            <StatCard
              label="Day streak"
              value={metrics?.streakDays ?? 0}
              subtext={isDemoMode ? 'Demo metric' : 'Consecutive practice days'}
              icon={Flame}
              delay={200}
            />
          </section>

          <section className="rounded-2xl border border-lavender-100 bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-lavender-100 px-5 py-4 sm:px-6">
              <h2 className="text-lg font-semibold text-navy">Recent interviews</h2>
              <span className="rounded-full bg-lavender-100 px-3 py-1 text-xs font-medium text-accent-purple">
                {isDemoMode ? 'Illustrative' : 'Supabase'}
              </span>
            </div>
            {recent.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-navy-muted">
                No interviews yet. Start your first session to see history here.
              </p>
            ) : (
              <ul className="divide-y divide-lavender-50">
                {recent.map((item, i) => (
                  <li
                    key={item.id}
                    className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 transition hover:bg-lavender-50/50"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <div>
                      <p className="font-medium text-navy">{item.role}</p>
                      <p className="text-sm text-navy-soft">
                        {typeLabels[item.type] ?? item.type} · {item.date}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-semibold text-accent-purple">
                        {item.status === 'completed' && item.score > 0
                          ? `${item.score}%`
                          : '—'}
                      </span>
                      <span className="rounded-lg bg-lavender-50 px-2 py-1 text-xs text-navy-muted capitalize">
                        {item.status.replace('-', ' ')}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <div className="rounded-2xl border border-dashed border-lavender-200 bg-lavender-50/50 p-6">
        <h3 className="font-semibold text-navy">Quick start</h3>
        <p className="mt-1 text-sm text-navy-muted">
          {isDemoMode
            ? 'Walk through setup and the interview room with local illustrative data.'
            : 'Configure your role and difficulty, answer questions, and save results to Supabase.'}
        </p>
        <Link
          to="/setup"
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent-purple hover:underline"
        >
          Go to interview setup
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </div>
  )
}

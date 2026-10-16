import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Briefcase, ChevronRight, Layers, Loader2, Sliders } from 'lucide-react'
import { useInterview } from '../context/InterviewContext'
import { useAuth } from '../context/AuthContext'
import { jobRoleSuggestions } from '../data/mockData'
import type { Difficulty, ExperienceLevel, InterviewType } from '../types/interview'

const experienceOptions: { value: ExperienceLevel; label: string }[] = [
  { value: 'junior', label: 'Junior (0–2 yrs)' },
  { value: 'mid', label: 'Mid-level (3–5 yrs)' },
  { value: 'senior', label: 'Senior (6+ yrs)' },
  { value: 'lead', label: 'Lead / Staff' },
]

const typeOptions: { value: InterviewType; label: string; desc: string }[] = [
  { value: 'technical', label: 'Technical', desc: 'Coding & architecture focus' },
  { value: 'behavioral', label: 'Behavioral', desc: 'STAR-style scenarios' },
  { value: 'system-design', label: 'System design', desc: 'Scale & trade-offs' },
  { value: 'mixed', label: 'Mixed', desc: 'Balanced session' },
]

const difficultyOptions: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Easy · 3 questions' },
  { value: 'medium', label: 'Medium · 4 questions' },
  { value: 'hard', label: 'Hard · 5 questions' },
]

export function Setup() {
  const navigate = useNavigate()
  const { user, isDemoMode } = useAuth()
  const { config, setConfig, startSession, sessionBusy, sessionError, clearSessionError } =
    useInterview()
  const [submitting, setSubmitting] = useState(false)

  const handleBegin = async () => {
    if (!isDemoMode && !user) return
    clearSessionError()
    setSubmitting(true)
    const ok = await startSession()
    setSubmitting(false)
    if (ok) navigate('/interview')
  }

  return (
    <div className="animate-fade-in mx-auto max-w-2xl space-y-8">
      <header>
        <p className="text-sm font-medium text-accent-purple">Step 1 of 2</p>
        <h1 className="font-display text-3xl text-navy">Interview setup</h1>
        <p className="mt-2 text-navy-muted">
          {isDemoMode
            ? 'Demo mode: configuration stays in this browser only (not Supabase or Gemini).'
            : 'Gemini generates your questions via the FastAPI backend; configuration is saved to Supabase when you begin.'}
        </p>
      </header>

      {sessionError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900" role="alert">
          {sessionError}
        </div>
      )}

      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault()
          void handleBegin()
        }}
      >
        <fieldset className="rounded-2xl border border-lavender-100 bg-white p-5 shadow-card sm:p-6">
          <legend className="flex items-center gap-2 px-1 text-sm font-semibold text-navy">
            <Briefcase className="h-4 w-4 text-accent-purple" aria-hidden />
            Job role
          </legend>
          <input
            type="text"
            list="roles"
            value={config.jobRole}
            onChange={(e) => setConfig({ jobRole: e.target.value })}
            className="mt-3 w-full rounded-xl border border-lavender-200 bg-lavender-50/50 px-4 py-3 text-navy outline-none transition focus:border-accent-violet focus:ring-2 focus:ring-lavender-200"
            placeholder="e.g. Frontend Engineer"
            required
            disabled={submitting || sessionBusy}
          />
          <datalist id="roles">
            {jobRoleSuggestions.map((role) => (
              <option key={role} value={role} />
            ))}
          </datalist>
        </fieldset>

        <fieldset className="rounded-2xl border border-lavender-100 bg-white p-5 shadow-card sm:p-6">
          <legend className="flex items-center gap-2 px-1 text-sm font-semibold text-navy">
            <Layers className="h-4 w-4 text-accent-purple" aria-hidden />
            Experience level
          </legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {experienceOptions.map((opt) => (
              <label
                key={opt.value}
                className={[
                  'cursor-pointer rounded-xl border px-4 py-3 text-sm transition',
                  config.experienceLevel === opt.value
                    ? 'border-accent-violet bg-lavender-50 font-medium text-accent-purple'
                    : 'border-lavender-100 hover:border-lavender-200',
                ].join(' ')}
              >
                <input
                  type="radio"
                  name="experience"
                  value={opt.value}
                  checked={config.experienceLevel === opt.value}
                  onChange={() => setConfig({ experienceLevel: opt.value })}
                  className="sr-only"
                  disabled={submitting || sessionBusy}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="rounded-2xl border border-lavender-100 bg-white p-5 shadow-card sm:p-6">
          <legend className="flex items-center gap-2 px-1 text-sm font-semibold text-navy">
            <Sliders className="h-4 w-4 text-accent-purple" aria-hidden />
            Interview type & difficulty
          </legend>
          <p className="mt-2 text-xs text-navy-soft">Interview type</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {typeOptions.map((opt) => (
              <label
                key={opt.value}
                className={[
                  'cursor-pointer rounded-xl border px-4 py-3 transition',
                  config.interviewType === opt.value
                    ? 'border-accent-violet bg-lavender-50'
                    : 'border-lavender-100 hover:border-lavender-200',
                ].join(' ')}
              >
                <input
                  type="radio"
                  name="type"
                  value={opt.value}
                  checked={config.interviewType === opt.value}
                  onChange={() => setConfig({ interviewType: opt.value })}
                  className="sr-only"
                  disabled={submitting || sessionBusy}
                />
                <span className="block text-sm font-medium text-navy">{opt.label}</span>
                <span className="text-xs text-navy-soft">{opt.desc}</span>
              </label>
            ))}
          </div>
          <p className="mt-4 text-xs text-navy-soft">Difficulty</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {difficultyOptions.map((opt) => (
              <label
                key={opt.value}
                className={[
                  'cursor-pointer rounded-full border px-4 py-2 text-sm transition',
                  config.difficulty === opt.value
                    ? 'border-accent-violet bg-accent-purple text-white'
                    : 'border-lavender-200 text-navy-muted hover:bg-lavender-50',
                ].join(' ')}
              >
                <input
                  type="radio"
                  name="difficulty"
                  value={opt.value}
                  checked={config.difficulty === opt.value}
                  onChange={() => setConfig({ difficulty: opt.value })}
                  className="sr-only"
                  disabled={submitting || sessionBusy}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={submitting || sessionBusy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-violet to-accent-purple py-3.5 text-sm font-semibold text-white shadow-glow transition hover:opacity-95 active:scale-[0.99] disabled:opacity-60"
        >
          {(submitting || sessionBusy) && (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          )}
          Begin interview
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </form>
    </div>
  )
}

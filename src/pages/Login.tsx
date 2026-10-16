import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Copy, Loader2, Presentation, Sparkles } from 'lucide-react'
import { DEMO_EMAIL, DEMO_PASSWORD, useAuth } from '../context/AuthContext'

function CopyableCredential({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 font-mono text-xs text-navy">
      <span className="min-w-0 truncate">
        <span className="text-navy-soft">{label}: </span>
        {value}
      </span>
      <button
        type="button"
        onClick={() => void copy()}
        className="shrink-0 rounded-md p-1 text-accent-purple hover:bg-lavender-50"
        aria-label={`Copy ${label}`}
      >
        <Copy className="h-3.5 w-3.5" />
      </button>
      {copied && <span className="sr-only">Copied</span>}
    </div>
  )
}

export function Login() {
  const navigate = useNavigate()
  const {
    signIn,
    signUp,
    signInWithDemo,
    configError,
    user,
    isDemoMode,
    loading: authLoading,
  } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [demoError, setDemoError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!authLoading && (user || isDemoMode)) {
      navigate('/', { replace: true })
    }
  }, [authLoading, user, isDemoMode, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setSubmitting(true)

    const message =
      mode === 'signin'
        ? await signIn(email, password)
        : await signUp(email, password, displayName || undefined)

    setSubmitting(false)

    if (message) {
      setError(message)
      return
    }

    if (mode === 'signup') {
      setInfo(
        'Account created. If email confirmation is enabled in Supabase, check your inbox before signing in.',
      )
      setMode('signin')
      return
    }

    navigate('/', { replace: true })
  }

  const [demoEmail, setDemoEmail] = useState(DEMO_EMAIL)
  const [demoPassword, setDemoPassword] = useState(DEMO_PASSWORD)

  const handleDemoContinue = () => {
    setDemoError(null)
    const message = signInWithDemo(demoEmail, demoPassword)
    if (message) {
      setDemoError(message)
      return
    }
    navigate('/', { replace: true })
  }

  const fillDemoAndShow = () => {
    setEmail(DEMO_EMAIL)
    setPassword(DEMO_PASSWORD)
    setDemoEmail(DEMO_EMAIL)
    setDemoPassword(DEMO_PASSWORD)
    setDemoError(null)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-lavender-50/40 to-white px-4 py-10">
      <div className="w-full max-w-md animate-fade-in space-y-6">
        <div className="rounded-2xl border border-lavender-100 bg-white p-8 shadow-card">
          <div className="mb-6 flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-accent-violet to-accent-purple text-white"
              aria-hidden
            >
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-2xl text-navy">Interview Agent</p>
              <p className="text-sm text-navy-muted">Real Supabase sign-in or demo mode</p>
            </div>
          </div>

          {configError && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
              Real sign-in: {configError}
            </div>
          )}

          <div className="mb-6 flex rounded-xl bg-lavender-50 p-1">
            <button
              type="button"
              className={[
                'flex-1 rounded-lg py-2 text-sm font-medium transition',
                mode === 'signin' ? 'bg-white text-accent-purple shadow-sm' : 'text-navy-muted',
              ].join(' ')}
              onClick={() => setMode('signin')}
            >
              Sign in
            </button>
            <button
              type="button"
              className={[
                'flex-1 rounded-lg py-2 text-sm font-medium transition',
                mode === 'signup' ? 'bg-white text-accent-purple shadow-sm' : 'text-navy-muted',
              ].join(' ')}
              onClick={() => setMode('signup')}
            >
              Sign up
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <label className="block text-sm font-medium text-navy-muted">
                Display name
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-lavender-200 px-4 py-2.5 outline-none focus:border-accent-violet focus:ring-2 focus:ring-lavender-200"
                  autoComplete="name"
                />
              </label>
            )}
            <label className="block text-sm font-medium text-navy-muted">
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-lavender-200 px-4 py-2.5 outline-none focus:border-accent-violet focus:ring-2 focus:ring-lavender-200"
                autoComplete="email"
              />
            </label>
            <label className="block text-sm font-medium text-navy-muted">
              Password
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-lavender-200 px-4 py-2.5 outline-none focus:border-accent-violet focus:ring-2 focus:ring-lavender-200"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
            </label>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
                {error}
              </p>
            )}
            {info && (
              <p className="rounded-lg bg-lavender-50 px-3 py-2 text-sm text-navy-muted">{info}</p>
            )}

            <button
              type="submit"
              disabled={submitting || Boolean(configError)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-violet to-accent-purple py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {mode === 'signin' ? 'Sign in with Supabase' : 'Create Supabase account'}
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-dashed border-violet-200 bg-violet-50/50 p-6 shadow-card">
          <div className="flex items-center gap-2 text-accent-purple">
            <Presentation className="h-5 w-5" aria-hidden />
            <h2 className="font-semibold text-navy">Demo login (no email confirmation)</h2>
          </div>
          <p className="mt-2 text-sm text-navy-muted">
            For presentations only. Uses local illustrative data — not connected to Supabase
            auth or your database.
          </p>

          <div className="mt-4 space-y-2">
            <CopyableCredential label="Email" value={DEMO_EMAIL} />
            <CopyableCredential label="Password" value={DEMO_PASSWORD} />
          </div>

          <div className="mt-4 space-y-3">
            <label className="block text-xs font-medium text-navy-muted">
              Demo email
              <input
                type="email"
                value={demoEmail}
                onChange={(e) => setDemoEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-lavender-200 px-3 py-2 text-sm outline-none focus:border-accent-violet"
              />
            </label>
            <label className="block text-xs font-medium text-navy-muted">
              Demo password
              <input
                type="password"
                value={demoPassword}
                onChange={(e) => setDemoPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-lavender-200 px-3 py-2 text-sm outline-none focus:border-accent-violet"
              />
            </label>
          </div>

          {demoError && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {demoError}
            </p>
          )}

          <button
            type="button"
            onClick={handleDemoContinue}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-accent-violet bg-white py-3 text-sm font-semibold text-accent-purple transition hover:bg-lavender-50"
          >
            Continue with Demo Account
          </button>

          <button
            type="button"
            onClick={fillDemoAndShow}
            className="mt-2 w-full text-center text-xs font-medium text-navy-soft underline-offset-2 hover:underline"
          >
            Fill demo credentials into the Supabase form above (for manual try)
          </button>
        </div>
      </div>
    </div>
  )
}

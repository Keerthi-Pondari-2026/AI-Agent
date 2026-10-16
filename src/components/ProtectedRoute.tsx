import { Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, configError, isDemoMode } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-navy-muted">
        <Loader2 className="h-8 w-8 animate-spin text-accent-purple" aria-hidden />
        <p className="text-sm">Checking your session…</p>
      </div>
    )
  }

  if (isDemoMode) {
    return children
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (configError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-900">
        <p className="font-semibold">Supabase is not configured</p>
        <p className="mt-2">{configError}</p>
        <p className="mt-3 text-red-800">
          Use <strong>Continue with Demo Account</strong> on the login page, or fix{' '}
          <code className="rounded bg-white/80 px-1">.env.local</code>. See{' '}
          <code className="rounded bg-white/80 px-1">SUPABASE_SETUP.md</code>.
        </p>
      </div>
    )
  }

  return children
}

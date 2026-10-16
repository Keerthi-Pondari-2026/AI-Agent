import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { fetchProfile } from '../services/profileService'

const SKIP = new Set(['/profile', '/login'])

export function ProfileGate({ children }: { children: React.ReactNode }) {
  const { user, isDemoMode, loading } = useAuth()
  const location = useLocation()
  const [checking, setChecking] = useState(true)
  const [needsProfile, setNeedsProfile] = useState(false)

  useEffect(() => {
    if (loading) return
    if (isDemoMode || !user || SKIP.has(location.pathname)) {
      setChecking(false)
      setNeedsProfile(false)
      return
    }
    fetchProfile(user.id)
      .then((p) => setNeedsProfile(!p?.profile_completed))
      .catch(() => setNeedsProfile(false))
      .finally(() => setChecking(false))
  }, [user, isDemoMode, loading, location.pathname])

  if (loading || checking) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-navy-muted">
        <Loader2 className="h-6 w-6 animate-spin text-accent-purple" aria-hidden />
        Loading…
      </div>
    )
  }

  if (needsProfile && !SKIP.has(location.pathname)) {
    return <Navigate to="/profile" replace />
  }

  return children
}

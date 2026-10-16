import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Settings2,
  UserCircle,
  Mic2,
  BarChart3,
  Sparkles,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { DEMO_EMAIL } from '../lib/demoAuth'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/profile', label: 'Profile & resume', icon: UserCircle },
  { to: '/setup', label: 'Interview setup', icon: Settings2 },
  { to: '/interview', label: 'Interview room', icon: Mic2 },
  { to: '/results', label: 'Results', icon: BarChart3 },
]

export function Sidebar() {
  const { user, isDemoMode, signOut } = useAuth()
  const navigate = useNavigate()

  const email = isDemoMode ? DEMO_EMAIL : (user?.email ?? '')
  const shortEmail = email.length > 24 ? `${email.slice(0, 22)}…` : email

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="flex w-full flex-col border-b border-lavender-100 bg-lavender-50/60 lg:fixed lg:inset-y-0 lg:z-30 lg:w-64 lg:border-b-0 lg:border-r">
      <div className="flex items-center gap-3 px-5 py-5 lg:px-6">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent-violet to-accent-purple text-white shadow-glow"
          aria-hidden
        >
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent-purple">
            {isDemoMode ? 'Demo mode' : 'AI Interview Agent'}
          </p>
          <p className="font-display text-lg leading-tight text-navy">
            Interview Agent
          </p>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-3 pb-4 lg:flex-col lg:overflow-visible lg:px-4 lg:pb-0">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                'flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-white text-accent-purple shadow-card'
                  : 'text-navy-muted hover:bg-white/70 hover:text-navy',
              ].join(' ')
            }
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto border-t border-lavender-100 p-5">
        {email && (
          <p className="mb-3 truncate text-xs text-navy-soft" title={email}>
            {shortEmail}
          </p>
        )}
        <button
          type="button"
          onClick={() => void handleSignOut()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-lavender-200 bg-white py-2 text-sm font-medium text-navy-muted transition hover:border-lavender-300 hover:text-navy"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          Sign out
        </button>
        <p className="mt-3 hidden text-xs leading-relaxed text-navy-soft lg:block">
          {isDemoMode
            ? 'Demo session only — no Supabase reads or writes.'
            : 'Data is stored in Supabase. Scores are heuristic until Gemini is connected.'}
        </p>
      </div>
    </aside>
  )
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import {
  getSupabaseConfigIssue,
  getSupabaseConfigMessage,
  isSupabaseConfigured,
  supabase,
} from '../lib/supabase'
import {
  activateDemoSession,
  clearDemoSession,
  DEMO_DISPLAY_NAME,
  isDemoSessionActive,
  validateDemoCredentials,
} from '../lib/demoAuth'

interface AuthContextValue {
  user: User | null
  session: Session | null
  loading: boolean
  isDemoMode: boolean
  isAuthenticated: boolean
  displayName: string
  configError: string | null
  signUp: (email: string, password: string, displayName?: string) => Promise<string | null>
  signIn: (email: string, password: string) => Promise<string | null>
  signInWithDemo: (email: string, password: string) => string | null
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDemoMode, setIsDemoMode] = useState(() => isDemoSessionActive())

  const configIssue = getSupabaseConfigIssue()
  const configError = configIssue ? getSupabaseConfigMessage(configIssue) : null

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false)
      return
    }

    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      if (data.session?.user) {
        clearDemoSession()
        setIsDemoMode(false)
      }
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (nextSession?.user) {
        clearDemoSession()
        setIsDemoMode(false)
      }
      setSession(nextSession)
      setUser(nextSession?.user ?? null)
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signUp = useCallback(
    async (email: string, password: string, displayName?: string) => {
      if (!isSupabaseConfigured()) return configError

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: displayName ? { display_name: displayName } : undefined,
        },
      })

      return error?.message ?? null
    },
    [configError],
  )

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!isSupabaseConfigured()) return configError

      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (!error) {
        clearDemoSession()
        setIsDemoMode(false)
      }
      return error?.message ?? null
    },
    [configError],
  )

  const signInWithDemo = useCallback((email: string, password: string) => {
    if (!validateDemoCredentials(email, password)) {
      return 'Invalid demo email or password. Use the demo credentials shown below.'
    }
    activateDemoSession()
    setIsDemoMode(true)
    return null
  }, [])

  const signOut = useCallback(async () => {
    clearDemoSession()
    setIsDemoMode(false)
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut()
    }
  }, [])

  const isAuthenticated = Boolean(user) || isDemoMode

  const displayName = isDemoMode
    ? DEMO_DISPLAY_NAME
    : (user?.user_metadata?.display_name as string | undefined) ??
      user?.email?.split('@')[0] ??
      'there'

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      isDemoMode,
      isAuthenticated,
      displayName,
      configError,
      signUp,
      signIn,
      signInWithDemo,
      signOut,
    }),
    [
      user,
      session,
      loading,
      isDemoMode,
      isAuthenticated,
      displayName,
      configError,
      signUp,
      signIn,
      signInWithDemo,
      signOut,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}

export { DEMO_EMAIL, DEMO_PASSWORD } from '../lib/demoAuth'

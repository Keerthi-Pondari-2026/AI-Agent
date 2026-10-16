/** Session flag only — not a Supabase session or JWT. */
export const DEMO_SESSION_STORAGE_KEY = 'ai-interview-agent-demo-session-active'

export const DEMO_EMAIL = 'demo@interviewagent.test'
export const DEMO_PASSWORD = 'DemoInterview123!'

export const DEMO_DISPLAY_NAME = 'Demo Presenter'

export function isDemoSessionActive(): boolean {
  try {
    return sessionStorage.getItem(DEMO_SESSION_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function activateDemoSession(): void {
  sessionStorage.setItem(DEMO_SESSION_STORAGE_KEY, 'true')
}

export function clearDemoSession(): void {
  sessionStorage.removeItem(DEMO_SESSION_STORAGE_KEY)
}

export function validateDemoCredentials(email: string, password: string): boolean {
  return email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD
}

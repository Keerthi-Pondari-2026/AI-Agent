import { Presentation } from 'lucide-react'

export function DemoModeBanner() {
  return (
    <div
      className="mb-6 flex items-start gap-3 rounded-xl border border-violet-200 bg-violet-50/80 px-4 py-3 text-sm text-navy"
      role="status"
    >
      <Presentation className="mt-0.5 h-5 w-5 shrink-0 text-accent-purple" aria-hidden />
      <div>
        <p className="font-semibold text-accent-purple">Demo mode</p>
        <p className="mt-0.5 text-navy-muted">
          Illustrative data only. Nothing is saved to Supabase. Sign out and use real
          sign-in to connect your account.
        </p>
      </div>
    </div>
  )
}

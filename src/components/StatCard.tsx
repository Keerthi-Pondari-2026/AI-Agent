import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  subtext?: string
  icon: LucideIcon
  delay?: number
}

export function StatCard({ label, value, subtext, icon: Icon, delay = 0 }: StatCardProps) {
  return (
    <div
      className="animate-slide-up rounded-2xl border border-lavender-100 bg-white p-5 shadow-card opacity-0"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-navy-muted">{label}</p>
          <p className="mt-1 font-display text-3xl text-navy">{value}</p>
          {subtext && <p className="mt-1 text-xs text-navy-soft">{subtext}</p>}
        </div>
        <div className="rounded-xl bg-lavender-100 p-2.5 text-accent-purple">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      </div>
    </div>
  )
}

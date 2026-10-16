import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export type SupabaseConfigIssue =
  | 'missing_url'
  | 'missing_anon_key'
  | 'missing_both'

export function getSupabaseConfigIssue(): SupabaseConfigIssue | null {
  const missingUrl = !supabaseUrl
  const missingKey = !supabaseAnonKey
  if (missingUrl && missingKey) return 'missing_both'
  if (missingUrl) return 'missing_url'
  if (missingKey) return 'missing_anon_key'
  return null
}

export function getSupabaseConfigMessage(issue: SupabaseConfigIssue): string {
  switch (issue) {
    case 'missing_both':
      return 'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local (project root).'
    case 'missing_url':
      return 'Add VITE_SUPABASE_URL to .env.local (project root).'
    case 'missing_anon_key':
      return 'Add VITE_SUPABASE_ANON_KEY (publishable/anon key) to .env.local. Never use the service role key here.'
  }
}

const configIssue = getSupabaseConfigIssue()
if (configIssue) {
  console.error(`[supabase] ${getSupabaseConfigMessage(configIssue)}`)
}

export const supabase: SupabaseClient = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)

export function isSupabaseConfigured(): boolean {
  return configIssue === null
}

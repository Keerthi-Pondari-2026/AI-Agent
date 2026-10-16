import { supabase } from '../lib/supabase'
import type { CandidateProfile } from '../types/profile'

const BUCKET = 'resumes'
const MAX_BYTES = 5 * 1024 * 1024

export class ProfileServiceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ProfileServiceError'
  }
}

export async function fetchProfile(userId: string): Promise<CandidateProfile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw new ProfileServiceError('Could not load your profile.')
  return data as CandidateProfile | null
}

export async function upsertProfile(
  userId: string,
  patch: Partial<CandidateProfile>,
): Promise<CandidateProfile> {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...patch })
    .select()
    .single()
  if (error || !data) throw new ProfileServiceError('Could not save profile.')
  return data as CandidateProfile
}

export async function extractResumeOnBackend(file: File): Promise<string> {
  const base = import.meta.env.VITE_API_URL?.replace(/\/$/, '')
  if (!base) throw new ProfileServiceError('VITE_API_URL is not configured.')
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${base}/api/resume/extract`, { method: 'POST', body: form })
  const body = (await res.json().catch(() => ({}))) as { detail?: string; excerpt?: string }
  if (!res.ok) throw new ProfileServiceError(body.detail ?? 'Resume extraction failed.')
  if (!body.excerpt) throw new ProfileServiceError('No text extracted from resume.')
  return body.excerpt
}

export async function uploadResumeFile(userId: string, file: File): Promise<string> {
  const ext = file.name.toLowerCase().endsWith('.docx') ? '.docx' : '.pdf'
  if (!file.name.toLowerCase().endsWith('.pdf') && !file.name.toLowerCase().endsWith('.docx')) {
    throw new ProfileServiceError('Only PDF and DOCX files are allowed.')
  }
  if (file.size > MAX_BYTES) throw new ProfileServiceError('File must be under 5 MB.')

  const path = `${userId}/resume-${Date.now()}${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type || undefined,
  })
  if (error) throw new ProfileServiceError('Could not upload resume to secure storage.')
  return path
}

export async function removeResumeFile(path: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) throw new ProfileServiceError('Could not remove resume file.')
}

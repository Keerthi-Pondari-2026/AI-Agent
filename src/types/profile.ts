export interface CandidateProfile {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  target_job_role: string | null
  resume_storage_path: string | null
  resume_filename: string | null
  resume_text_excerpt: string | null
  profile_completed: boolean
}

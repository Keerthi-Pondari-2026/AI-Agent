import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Loader2, Trash2, Upload } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  extractResumeOnBackend,
  fetchProfile,
  ProfileServiceError,
  removeResumeFile,
  uploadResumeFile,
  upsertProfile,
} from '../services/profileService'

export function Profile() {
  const { user, isDemoMode } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [targetRole, setTargetRole] = useState('')
  const [resumeFilename, setResumeFilename] = useState<string | null>(null)
  const [resumePath, setResumePath] = useState<string | null>(null)
  const [excerpt, setExcerpt] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadPct, setUploadPct] = useState<number | null>(null)

  useEffect(() => {
    if (isDemoMode) {
      navigate('/setup', { replace: true })
      return
    }
    if (!user) return
    setEmail(user.email ?? '')
    fetchProfile(user.id).then((p) => {
      if (!p) return
      setFullName(p.full_name ?? '')
      setPhone(p.phone ?? '')
      setTargetRole(p.target_job_role ?? '')
      setResumeFilename(p.resume_filename)
      setResumePath(p.resume_storage_path)
      setExcerpt(p.resume_text_excerpt)
    })
  }, [user, isDemoMode, navigate])

  const onFile = async (file: File | null) => {
    if (!file || !user) return
    setError(null)
    setBusy(true)
    setUploadPct(10)
    try {
      setUploadPct(40)
      const text = await extractResumeOnBackend(file)
      setUploadPct(70)
      const path = await uploadResumeFile(user.id, file)
      setUploadPct(100)
      setExcerpt(text)
      setResumeFilename(file.name)
      setResumePath(path)
      await upsertProfile(user.id, {
        resume_filename: file.name,
        resume_storage_path: path,
        resume_text_excerpt: text,
      })
    } catch (e) {
      setError(e instanceof ProfileServiceError ? e.message : 'Upload failed.')
    } finally {
      setBusy(false)
      setUploadPct(null)
    }
  }

  const onRemoveResume = async () => {
    if (!user || !resumePath) return
    setBusy(true)
    try {
      await removeResumeFile(resumePath)
      await upsertProfile(user.id, {
        resume_filename: null,
        resume_storage_path: null,
        resume_text_excerpt: null,
      })
      setResumeFilename(null)
      setResumePath(null)
      setExcerpt(null)
    } catch (e) {
      setError(e instanceof ProfileServiceError ? e.message : 'Could not remove resume.')
    } finally {
      setBusy(false)
    }
  }

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!fullName.trim()) {
      setError('Full name is required.')
      return
    }
    if (!excerpt) {
      setError('Please upload a resume (PDF or DOCX).')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await upsertProfile(user.id, {
        full_name: fullName.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        target_job_role: targetRole.trim() || null,
        profile_completed: true,
      })
      navigate('/setup')
    } catch (err) {
      setError(err instanceof ProfileServiceError ? err.message : 'Could not save profile.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl animate-fade-in space-y-6">
      <header>
        <h1 className="font-display text-3xl text-navy">Candidate profile</h1>
        <p className="mt-2 text-navy-muted">
          Upload your resume so Gemini can personalize interview questions. Files stay in your
          private Supabase storage bucket.
        </p>
      </header>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900" role="alert">
          {error}
        </p>
      )}

      <form onSubmit={onSave} className="space-y-6">
        <fieldset className="rounded-2xl border border-lavender-100 bg-white p-6 shadow-card space-y-4">
          <label className="block text-sm font-medium text-navy-muted">
            Full name *
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-lavender-200 px-4 py-2.5"
            />
          </label>
          <label className="block text-sm font-medium text-navy-muted">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-lavender-200 px-4 py-2.5"
            />
          </label>
          <label className="block text-sm font-medium text-navy-muted">
            Phone (optional)
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-xl border border-lavender-200 px-4 py-2.5"
            />
          </label>
          <label className="block text-sm font-medium text-navy-muted">
            Target job role
            <input
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Data Analyst"
              className="mt-1 w-full rounded-xl border border-lavender-200 px-4 py-2.5"
            />
          </label>
        </fieldset>

        <fieldset className="rounded-2xl border border-lavender-100 bg-white p-6 shadow-card">
          <legend className="flex items-center gap-2 text-sm font-semibold text-navy">
            <FileText className="h-4 w-4 text-accent-purple" aria-hidden />
            Resume (PDF or DOCX, max 5 MB) *
          </legend>
          {resumeFilename ? (
            <div className="mt-3 flex items-center justify-between rounded-xl bg-lavender-50 px-4 py-3 text-sm">
              <span>{resumeFilename}</span>
              <button
                type="button"
                onClick={() => void onRemoveResume()}
                className="inline-flex items-center gap-1 text-red-600"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                Remove
              </button>
            </div>
          ) : (
            <p className="mt-2 text-sm text-navy-soft">No resume uploaded yet.</p>
          )}
          {uploadPct !== null && (
            <p className="mt-2 text-xs text-accent-purple">Processing… {uploadPct}%</p>
          )}
          <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-lavender-300 px-4 py-6 text-sm font-medium text-accent-purple hover:bg-lavender-50">
            <Upload className="h-4 w-4" aria-hidden />
            {busy ? 'Uploading…' : 'Choose resume file'}
            <input
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="sr-only"
              disabled={busy}
              onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
            />
          </label>
          {excerpt && (
            <p className="mt-3 text-xs text-navy-soft">
              Extracted {excerpt.length} characters for personalization (stored securely).
            </p>
          )}
        </fieldset>

        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-violet to-accent-purple py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Save & continue to interview setup
        </button>
      </form>
    </div>
  )
}

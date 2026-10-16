-- Resume-based voice interview platform (incremental)

-- ---------------------------------------------------------------------------
-- Extend profiles
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists full_name text,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists target_job_role text,
  add column if not exists resume_storage_path text,
  add column if not exists resume_filename text,
  add column if not exists resume_text_excerpt text,
  add column if not exists profile_completed boolean not null default false;

-- ---------------------------------------------------------------------------
-- Extend interviews
-- ---------------------------------------------------------------------------
alter table public.interviews
  add column if not exists candidate_name text,
  add column if not exists question_count int not null default 5,
  add column if not exists job_description text,
  add column if not exists resume_excerpt_snapshot text,
  add column if not exists interview_category text;

alter table public.interviews drop constraint if exists interviews_experience_level_check;
alter table public.interviews add constraint interviews_experience_level_check check (
  experience_level in (
    'junior', 'mid', 'senior', 'lead',
    'fresher', 'entry', 'experienced'
  )
);

alter table public.interviews drop constraint if exists interviews_interview_type_check;
alter table public.interviews add constraint interviews_interview_type_check check (
  interview_type in (
    'technical', 'behavioral', 'system-design', 'mixed',
    'hr', 'aptitude', 'logical-reasoning'
  )
);

alter table public.interview_answers
  add column if not exists evaluation_json jsonb;

alter table public.interview_results
  add column if not exists question_feedback jsonb not null default '[]'::jsonb,
  add column if not exists study_topics text[] not null default '{}';

-- ---------------------------------------------------------------------------
-- Private resume storage bucket (run once; safe if bucket exists)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resumes',
  'resumes',
  false,
  5242880,
  array['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 5242880;

-- Users can manage files under their own folder: {user_id}/...
drop policy if exists "resumes_select_own" on storage.objects;
create policy "resumes_select_own"
  on storage.objects for select
  using (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "resumes_insert_own" on storage.objects;
create policy "resumes_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "resumes_update_own" on storage.objects;
create policy "resumes_update_own"
  on storage.objects for update
  using (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "resumes_delete_own" on storage.objects;
create policy "resumes_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- AI Interview Agent — initial schema, RLS, and profile trigger
-- Run in Supabase SQL Editor (Dashboard → SQL → New query) if not using CLI.

-- Extensions
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- interviews
-- ---------------------------------------------------------------------------
create table if not exists public.interviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  job_role text not null,
  experience_level text not null check (
    experience_level in ('junior', 'mid', 'senior', 'lead')
  ),
  interview_type text not null check (
    interview_type in ('technical', 'behavioral', 'system-design', 'mixed')
  ),
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  status text not null default 'in_progress' check (
    status in ('draft', 'in_progress', 'completed', 'cancelled')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists interviews_user_id_idx on public.interviews (user_id);
create index if not exists interviews_user_created_idx on public.interviews (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- interview_questions
-- ---------------------------------------------------------------------------
create table if not exists public.interview_questions (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references public.interviews (id) on delete cascade,
  question_order int not null check (question_order >= 0),
  category text not null,
  prompt text not null,
  hint text,
  created_at timestamptz not null default now(),
  unique (interview_id, question_order)
);

create index if not exists interview_questions_interview_id_idx
  on public.interview_questions (interview_id);

-- ---------------------------------------------------------------------------
-- interview_answers
-- ---------------------------------------------------------------------------
create table if not exists public.interview_answers (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references public.interviews (id) on delete cascade,
  question_id uuid not null references public.interview_questions (id) on delete cascade,
  answer_text text not null default '',
  feedback text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (question_id)
);

create index if not exists interview_answers_interview_id_idx
  on public.interview_answers (interview_id);

-- ---------------------------------------------------------------------------
-- interview_results
-- ---------------------------------------------------------------------------
create table if not exists public.interview_results (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null unique references public.interviews (id) on delete cascade,
  overall_score int not null check (overall_score between 0 and 100),
  category_scores jsonb not null default '[]'::jsonb,
  strengths text[] not null default '{}',
  improvements text[] not null default '{}',
  recommendations text[] not null default '{}',
  summary text,
  is_illustrative boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists interview_results_interview_id_idx
  on public.interview_results (interview_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists interviews_set_updated_at on public.interviews;
create trigger interviews_set_updated_at
  before update on public.interviews
  for each row execute function public.set_updated_at();

drop trigger if exists interview_answers_set_updated_at on public.interview_answers;
create trigger interview_answers_set_updated_at
  before update on public.interview_answers
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- new user profile
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- ownership helper (for RLS on child tables)
-- ---------------------------------------------------------------------------
create or replace function public.user_owns_interview(interview_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.interviews i
    where i.id = interview_uuid
      and i.user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.interviews enable row level security;
alter table public.interview_questions enable row level security;
alter table public.interview_answers enable row level security;
alter table public.interview_results enable row level security;

-- profiles
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- interviews
drop policy if exists "interviews_select_own" on public.interviews;
create policy "interviews_select_own"
  on public.interviews for select
  using (auth.uid() = user_id);

drop policy if exists "interviews_insert_own" on public.interviews;
create policy "interviews_insert_own"
  on public.interviews for insert
  with check (auth.uid() = user_id);

drop policy if exists "interviews_update_own" on public.interviews;
create policy "interviews_update_own"
  on public.interviews for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "interviews_delete_own" on public.interviews;
create policy "interviews_delete_own"
  on public.interviews for delete
  using (auth.uid() = user_id);

-- interview_questions
drop policy if exists "questions_select_own" on public.interview_questions;
create policy "questions_select_own"
  on public.interview_questions for select
  using (public.user_owns_interview(interview_id));

drop policy if exists "questions_insert_own" on public.interview_questions;
create policy "questions_insert_own"
  on public.interview_questions for insert
  with check (public.user_owns_interview(interview_id));

drop policy if exists "questions_update_own" on public.interview_questions;
create policy "questions_update_own"
  on public.interview_questions for update
  using (public.user_owns_interview(interview_id))
  with check (public.user_owns_interview(interview_id));

drop policy if exists "questions_delete_own" on public.interview_questions;
create policy "questions_delete_own"
  on public.interview_questions for delete
  using (public.user_owns_interview(interview_id));

-- interview_answers
drop policy if exists "answers_select_own" on public.interview_answers;
create policy "answers_select_own"
  on public.interview_answers for select
  using (public.user_owns_interview(interview_id));

drop policy if exists "answers_insert_own" on public.interview_answers;
create policy "answers_insert_own"
  on public.interview_answers for insert
  with check (public.user_owns_interview(interview_id));

drop policy if exists "answers_update_own" on public.interview_answers;
create policy "answers_update_own"
  on public.interview_answers for update
  using (public.user_owns_interview(interview_id))
  with check (public.user_owns_interview(interview_id));

drop policy if exists "answers_delete_own" on public.interview_answers;
create policy "answers_delete_own"
  on public.interview_answers for delete
  using (public.user_owns_interview(interview_id));

-- interview_results
drop policy if exists "results_select_own" on public.interview_results;
create policy "results_select_own"
  on public.interview_results for select
  using (public.user_owns_interview(interview_id));

drop policy if exists "results_insert_own" on public.interview_results;
create policy "results_insert_own"
  on public.interview_results for insert
  with check (public.user_owns_interview(interview_id));

drop policy if exists "results_update_own" on public.interview_results;
create policy "results_update_own"
  on public.interview_results for update
  using (public.user_owns_interview(interview_id))
  with check (public.user_owns_interview(interview_id));

drop policy if exists "results_delete_own" on public.interview_results;
create policy "results_delete_own"
  on public.interview_results for delete
  using (public.user_owns_interview(interview_id));

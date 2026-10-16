# Supabase setup — AI Interview Agent

This guide helps you connect your local app to Supabase **without putting secrets in Git**.

## 1. Find your project URL and anon (publishable) key

1. Open [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project.
3. Go to **Project Settings** → **API**.
4. Copy:
   - **Project URL** (example shape: `https://xxxxx.supabase.co`)
   - **anon public** or **publishable** key (safe for browser apps)

Do **not** use the **service_role** key in the React app.

## 2. Local environment file

In the project root (same folder as `package.json`), create or edit **`.env.local`**:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_publishable_or_anon_key_here
```

Restart the dev server after changes:

```powershell
cd C:\Users\HP\AI-Projects\AI-Agent
npm run dev
```

See **`.env.example`** for a template (placeholders only).

## 3. Run the database migration

The schema lives in:

`supabase/migrations/001_initial_schema.sql`

**If you do not use the Supabase CLI**, run the SQL manually:

1. Dashboard → **SQL** → **New query**
2. Paste the full contents of `001_initial_schema.sql`
3. Click **Run**

This creates tables, RLS policies, and a trigger to create a `profiles` row when a user signs up.

Then run **`supabase/migrations/002_resume_voice_platform.sql`** the same way. It adds:

- Profile fields (`full_name`, resume metadata, `profile_completed`, target role)
- Extended interview configuration columns
- Private **`resumes`** storage bucket and RLS policies
- Richer results fields (`question_feedback`, `study_topics`)

> The agent cannot verify that this ran on your project unless you run it in your dashboard.

## 4. Authentication settings

1. Dashboard → **Authentication** → **Providers** → enable **Email**.
2. For local testing, you may disable **Confirm email** under **Authentication** → **Settings** (optional; re-enable for production).
3. **URL configuration** (Authentication → **URL configuration**):
   - **Site URL**: `http://localhost:5173`
   - **Redirect URLs** (add):
     - `http://localhost:5173`
     - `http://localhost:5173/**`

For production (Vercel), add your deployed URL later, for example:

- `https://your-app.vercel.app`
- `https://your-app.vercel.app/**`

## 5. Verify the integration

### Auth

1. `npm run dev`
2. Open the app → you should be redirected to **/login**
3. **Sign up** with email + password
4. **Sign in** and confirm the sidebar shows your email

### Database reads (dashboard)

1. Complete at least one interview (setup → answer questions → finish)
2. Dashboard should show **Recent interviews** and updated **Interviews completed** count
3. If you see an error about missing tables, run the migration (step 3)

### Database writes

1. During an interview, type answers — they should auto-save to `interview_answers`
2. Finish the session — rows should appear in `interview_results` and `interviews.status` should be `completed`

### RLS (Row Level Security)

In the SQL Editor (as an authenticated user via the app, not the service role):

- You should only see **your** rows in `interviews`, `interview_questions`, `interview_answers`, and `interview_results`.
- Another user’s `user_id` must not be readable or writable.

To inspect data as admin, use **Table Editor** in the dashboard (bypasses RLS with your admin session) — do not ship the service role key to the frontend.

## 6. Tables created by the migration

| Table | Purpose |
|-------|---------|
| `profiles` | Display name linked to `auth.users` |
| `interviews` | Session config, status, owner |
| `interview_questions` | Questions per interview |
| `interview_answers` | User answers per question |
| `interview_results` | Scores and feedback summary |

All user-owned tables have RLS enabled with policies tied to `auth.uid()` or interview ownership.

## 7. Troubleshooting

| Symptom | Likely fix |
|---------|------------|
| “Supabase is not configured” on login | Add both `VITE_*` vars to `.env.local` and restart `npm run dev` |
| “Could not create interview session” | Run `001_initial_schema.sql` in SQL Editor |
| Sign-up works but no profile | Re-run migration (includes `handle_new_user` trigger) |
| 401 / JWT errors | Check anon key matches the project URL |

## 8. Security reminders

- Never commit `.env.local`
- Never put `GEMINI_API_KEY` or Supabase **service_role** in the frontend
- Gemini integration (future) belongs on a backend only

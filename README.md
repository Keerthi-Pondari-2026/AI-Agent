# AI Interview Agent — Resume-based voice mock interviews

Authenticated candidates upload a resume, configure a mock interview (Technical, HR, Aptitude, Logical Reasoning, or Mixed), hear questions spoken aloud, answer by voice or text, and receive Gemini-generated feedback saved to Supabase.

**Demo mode** (login page) uses illustrative questions and heuristic scores only — no Gemini or Supabase persistence.

## Stack

- **Frontend:** React, Vite, TypeScript, Tailwind
- **Backend:** FastAPI + Google Gemini (`backend/`)
- **Auth & DB:** Supabase (Auth, Postgres, Storage)

## Prerequisites

- Node.js 18+
- Python 3.11+ (virtualenv in `backend/.venv`)
- Supabase project with migrations applied
- Gemini API key (backend only)

## Setup

### 1. Supabase

Follow [SUPABASE_SETUP.md](./SUPABASE_SETUP.md). Run both SQL migrations (`001` and `002`).

### 2. Frontend env

Copy `.env.example` → `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=http://localhost:8000
```

Never put `GEMINI_API_KEY` in the frontend.

### 3. Backend env

Copy `backend/.env.example` → `backend/.env`:

```env
GEMINI_API_KEY=your_key
GEMINI_MODEL=gemini-2.0-flash
CORS_ORIGINS=http://localhost:5173
```

### 4. Install and run

```powershell
cd C:\Users\HP\AI-Projects\AI-Agent
npm install
npm run dev

cd backend
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\uvicorn.exe app.main:app --reload --port 8000
```

Open `http://localhost:5173`.

## User flow

1. **Sign up / sign in** (or use **Demo** on the login page).
2. **Profile & resume** (`/profile`) — PDF/DOCX upload, text extracted via `POST /api/resume/extract`, file stored in private `resumes` bucket.
3. **Interview setup** (`/setup`) — category, role, difficulty, 5/10/15 questions, optional job description.
4. **Interview room** — Web Speech API for TTS (questions) and STT (answers); text answers always available.
5. **Results** — Gemini summary, per-question feedback, study topics; stored in `interview_results`.

New users with `profile_completed = false` are redirected to `/profile` before other app routes.

## Voice support

- **Speech synthesis** (question playback): widely supported in Chromium-based browsers.
- **Speech recognition**: best in Chrome/Edge; may be unavailable in Firefox/Safari — use text answers.
- Microphone permission is required for voice answers. Audio is processed in the browser; only the transcript is submitted.

## Build & checks

```powershell
npm run build
cd backend
.\.venv\Scripts\python.exe -m compileall app
```

Verified locally: `npm run build` and `python -m compileall app` succeed. Gemini, Supabase, and speech features require your credentials and manual browser testing.

## Deployment notes

- Set `VITE_*` env vars on the static host (e.g. Vercel).
- Deploy the FastAPI backend separately; set `VITE_API_URL` to its public URL.
- Add production URLs to Supabase Auth redirect allowlist.
- Use `vercel.json` SPA rewrites if you deploy the frontend to Vercel.

## Security

- Gemini key and service role keys stay on the server only.
- Resume files use private storage; do not expose bucket URLs publicly.
- RLS policies scope rows to `auth.uid()`.

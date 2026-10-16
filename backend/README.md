# AI Interview Agent — FastAPI + Gemini

The Gemini API key lives **only** in `backend/.env`. The React app calls this API via `VITE_API_URL`.

## 1. Virtual environment

```powershell
cd C:\Users\HP\AI-Projects\AI-Agent\backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
py -m pip install -r requirements.txt
```

## 2. Configure secrets

Copy the example file:

```powershell
copy .env.example .env
```

Edit **`backend/.env`** (not committed to Git):

```env
GEMINI_API_KEY=your_key_from_google_ai_studio
GEMINI_MODEL=gemini-2.0-flash
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Get the key from [Google AI Studio](https://aistudio.google.com/apikey). Never put it in the frontend or `VITE_*` variables.

## 3. Run the API

**Recommended** (uses `backend\.venv` automatically):

```powershell
cd C:\Users\HP\AI-Projects\AI-Agent\backend
.\run.ps1
```

Or activate the venv first, then run uvicorn with **that** Python (not system `py`):

```powershell
cd C:\Users\HP\AI-Projects\AI-Agent\backend
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### `Form data requires "python-multipart"`

This means uvicorn is using **global** Python (e.g. `pythoncore-3.15`) instead of `backend\.venv`. Fix:

```powershell
cd C:\Users\HP\AI-Projects\AI-Agent\backend
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

Or run `.\run.ps1`.

Health check: http://localhost:8000/health

## 4. Run the frontend

In another terminal:

```powershell
cd C:\Users\HP\AI-Projects\AI-Agent
```

Add to **`.env.local`** (project root):

```env
VITE_API_URL=http://localhost:8000
```

```powershell
npm run dev
```

Sign in with Supabase (not demo mode) to use live Gemini questions and evaluation.

## API endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Service health + whether Gemini key is set |
| POST | `/api/interview/generate-questions` | Initial question set |
| POST | `/api/interview/follow-up` | Optional follow-up question |
| POST | `/api/interview/evaluate-answer` | Per-answer feedback |
| POST | `/api/interview/final-summary` | Overall results |

## Production

- **Frontend (Vercel):** set `VITE_API_URL` to your deployed API URL.
- **Backend:** deploy this FastAPI app to Render, Railway, Fly.io, or similar.
- Set `CORS_ORIGINS` to your Vercel domain (e.g. `https://your-app.vercel.app`).
- Set `GEMINI_API_KEY` and `GEMINI_MODEL` in the host’s environment variables.

## Demo mode

Demo login in the React app does **not** call this API and does not use Gemini.

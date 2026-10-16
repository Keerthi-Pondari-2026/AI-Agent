import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Loader2,
  LogOut,
  MessageSquare,
  RotateCcw,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
} from 'lucide-react'
import { useInterview } from '../context/InterviewContext'
import { useAuth } from '../context/AuthContext'
import { useInterviewSpeech } from '../hooks/useInterviewSpeech'

export function InterviewRoom() {
  const navigate = useNavigate()
  const { isDemoMode } = useAuth()
  const {
    config,
    interviewId,
    questions,
    answers,
    evaluations,
    lastEvaluation,
    setAnswerLocal,
    persistAnswer,
    currentIndex,
    setCurrentIndex,
    advanceFromCurrentQuestion,
    completeSession,
    sessionBusy,
    sessionError,
    retryLastAction,
    clearSessionError,
  } = useInterview()

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [paused, setPaused] = useState(false)
  const [endConfirm, setEndConfirm] = useState(false)
  const speech = useInterviewSpeech()
  const lastSpokenId = useRef<string | null>(null)

  const scheduleSave = useCallback(
    (questionId: string, text: string) => {
      if (isDemoMode) return
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        void persistAnswer(questionId, text)
      }, 600)
    },
    [persistAnswer, isDemoMode],
  )

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [])

  const total = questions.length
  const current = questions[currentIndex]
  const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 0
  const currentEval = current ? evaluations[current.id] : undefined

  useEffect(() => {
    const q = questions[currentIndex]
    if (!q || paused) return
    if (lastSpokenId.current === q.id) return
    lastSpokenId.current = q.id
    speech.speakQuestion(q.prompt, () => {
      if (speech.autoListenAfterSpeak && speech.recognitionSupported) {
        speech.startListening((text) => {
          setAnswerLocal(q.id, text)
        })
      }
    })
  }, [questions, currentIndex, paused, speech, setAnswerLocal])

  const endInterview = async () => {
    const ok = await completeSession()
    if (ok) navigate('/results')
  }

  const goNext = async () => {
    if (isDemoMode) {
      setCurrentIndex(Math.min(currentIndex + 1, total - 1))
      return
    }
    clearSessionError()
    const ok = await advanceFromCurrentQuestion()
    if (!ok) return
  }

  if (!interviewId || total === 0) {
    return (
      <div className="animate-fade-in text-center">
        <p className="text-navy-muted">No active interview session.</p>
        <Link to="/setup" className="mt-4 inline-block text-accent-purple">
          Go to interview setup
        </Link>
      </div>
    )
  }

  if (!current) return null

  const answerText = answers[current.id] ?? ''

  return (
    <div className="animate-fade-in space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-accent-purple">
            {isDemoMode
              ? 'Demo session (illustrative, no AI)'
              : 'Live session · Gemini AI'}
          </p>
          <h1 className="font-display text-2xl text-navy sm:text-3xl">
            {config.jobRole}
          </h1>
          <p className="text-sm text-navy-soft capitalize">
            {config.interviewCategory.replace('-', ' ')} · {config.difficulty} ·{' '}
            {config.experienceLevel} · {config.questionCount} questions
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (!endConfirm) {
              setEndConfirm(true)
              return
            }
            void endInterview()
          }}
          disabled={sessionBusy}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-lavender-200 bg-white px-4 py-2.5 text-sm font-medium text-navy-muted transition hover:border-red-200 hover:text-red-600 disabled:opacity-50"
        >
          {sessionBusy ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <LogOut className="h-4 w-4" aria-hidden />
          )}
          {endConfirm ? 'Confirm end' : 'End interview'}
        </button>
      </header>
      {endConfirm && (
        <p className="text-sm text-amber-800">Click &quot;Confirm end&quot; again to finish early.</p>
      )}

      {sessionError && (
        <div
          className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900 sm:flex-row sm:items-center sm:justify-between"
          role="alert"
        >
          <span>{sessionError}</span>
          {retryLastAction && (
            <button
              type="button"
              onClick={() => void retryLastAction()}
              className="inline-flex items-center justify-center gap-1 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-900"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              Retry
            </button>
          )}
        </div>
      )}

      <div className="rounded-full bg-lavender-100 p-1">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-accent-violet to-accent-purple transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Interview progress"
        />
      </div>
      <p className="text-center text-xs font-medium text-navy-soft">
        Question {currentIndex + 1} of {total}
      </p>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-lavender-100 bg-white px-4 py-3 text-sm">
        <span
          className={[
            'inline-flex h-2 w-2 rounded-full',
            speech.status === 'speaking' ? 'bg-accent-purple animate-pulse' : speech.status === 'listening' ? 'bg-emerald-500 animate-pulse' : 'bg-lavender-200',
          ].join(' ')}
          aria-hidden
        />
        <span className="text-navy-muted capitalize">
          {speech.status === 'idle' ? 'Ready' : speech.status}
        </span>
        <button type="button" className="rounded-lg border px-2 py-1" onClick={() => speech.speakQuestion(current.prompt)}>
          <Volume2 className="h-4 w-4 inline" aria-hidden /> Replay
        </button>
        <button
          type="button"
          className="rounded-lg border px-2 py-1"
          onClick={() => speech.setSpeechEnabled(!speech.speechEnabled)}
        >
          {speech.speechEnabled ? <VolumeX className="h-4 w-4" aria-hidden /> : <Volume2 className="h-4 w-4" aria-hidden />}
          {speech.speechEnabled ? 'Mute voice' : 'Enable voice'}
        </button>
        <button
          type="button"
          className="rounded-lg border px-2 py-1"
          onClick={() => {
            if (speech.status === 'listening') speech.stopListening()
            else speech.startListening((t) => setAnswerLocal(current.id, t))
          }}
          disabled={!speech.recognitionSupported}
        >
          {speech.status === 'listening' ? <MicOff className="h-4 w-4 inline" aria-hidden /> : <Mic className="h-4 w-4 inline" aria-hidden />}
          {speech.status === 'listening' ? 'Stop mic' : 'Record answer'}
        </button>
        <button type="button" className="rounded-lg border px-2 py-1" onClick={() => setPaused((p) => !p)}>
          {paused ? 'Resume' : 'Pause'}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_220px]">
        <div className="rounded-2xl border border-lavender-100 bg-white p-6 shadow-card sm:p-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-lavender-100 px-3 py-1 text-xs font-semibold text-accent-purple">
            <MessageSquare className="h-3.5 w-3.5" aria-hidden />
            {current.category}
            {current.isFollowUp && ' · Follow-up'}
          </span>
          <p className="mt-4 text-lg font-medium leading-relaxed text-navy sm:text-xl">
            {current.prompt}
          </p>
          {current.hint && (
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-lavender-50 p-3 text-sm text-navy-muted">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-accent-violet" aria-hidden />
              {current.hint}
            </p>
          )}

          {speech.liveTranscript && (
            <p className="mt-4 rounded-lg bg-lavender-50 p-2 text-xs text-navy-muted">
              Live transcript (edit before submit): {speech.liveTranscript}
            </p>
          )}
          <label className="mt-6 block text-sm font-medium text-navy-muted">
            Your answer (voice or text)
            <textarea
              value={answerText}
              onChange={(e) => {
                const text = e.target.value
                setAnswerLocal(current.id, text)
                speech.setLiveTranscript(text)
                scheduleSave(current.id, text)
              }}
              rows={8}
              placeholder="Type your response as you would in a real interview…"
              className="mt-2 w-full resize-y rounded-xl border border-lavender-200 bg-lavender-50/30 px-4 py-3 text-navy outline-none transition focus:border-accent-violet focus:ring-2 focus:ring-lavender-200"
            />
          </label>
          <p className="mt-2 text-xs text-navy-soft">
            {answerText.length > 0
              ? `${answerText.split(/\s+/).filter(Boolean).length} words · ${
                  isDemoMode ? 'saved in this browser only' : 'auto-saved to Supabase'
                }`
              : isDemoMode
                ? 'Demo mode: answers stay in this browser only.'
                : 'Answers save to Supabase; Gemini evaluates when you go to the next question.'}
          </p>

          {!isDemoMode && (currentEval || lastEvaluation) && (
            <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 text-sm text-navy-muted">
              <p className="font-semibold text-navy">
                Gemini feedback · score {(currentEval ?? lastEvaluation)!.score}/100
              </p>
              <p className="mt-2">{(currentEval ?? lastEvaluation)!.summary_feedback}</p>
            </div>
          )}
        </div>

        <nav className="rounded-2xl border border-lavender-100 bg-white p-4 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-navy-soft">
            Questions
          </p>
          <ul className="mt-3 space-y-2">
            {questions.map((q, idx) => {
              const answered = Boolean(answers[q.id]?.trim())
              return (
                <li key={q.id}>
                  <button
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={[
                      'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition',
                      idx === currentIndex
                        ? 'bg-lavender-100 font-medium text-accent-purple'
                        : 'text-navy-muted hover:bg-lavender-50',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs',
                        answered ? 'bg-accent-purple text-white' : 'bg-lavender-100',
                      ].join(' ')}
                    >
                      {idx + 1}
                    </span>
                    <span className="line-clamp-2">{q.category}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <button
          type="button"
          disabled={currentIndex === 0 || sessionBusy}
          onClick={() => setCurrentIndex(currentIndex - 1)}
          className="inline-flex items-center justify-center gap-1 rounded-xl border border-lavender-200 px-4 py-2.5 text-sm font-medium text-navy disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Previous
        </button>
        {currentIndex < total - 1 ? (
          <button
            type="button"
            onClick={() => void goNext()}
            disabled={sessionBusy}
            className="inline-flex items-center justify-center gap-1 rounded-xl bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy/90 disabled:opacity-60"
          >
            {sessionBusy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {isDemoMode ? 'Next question' : 'Submit & next'}
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void endInterview()}
            disabled={sessionBusy}
            className="inline-flex items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-accent-violet to-accent-purple px-5 py-2.5 text-sm font-semibold text-white shadow-glow disabled:opacity-60"
          >
            {sessionBusy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            Finish & view results
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>
    </div>
  )
}

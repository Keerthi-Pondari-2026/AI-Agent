import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { InterviewConfig, InterviewQuestion, DemoResults } from '../types/interview'
import type { AnswerEvaluation } from '../types/gemini'
import {
  appendInterviewQuestion,
  completeInterviewSession,
  createInterviewRecord,
  dbResultToDemoResults,
  fetchInterviewResult,
  finalSummaryToDemoResults,
  insertGeneratedQuestions,
  upsertAnswer,
} from '../services/interviewService'
import {
  evaluateAnswerApi,
  fetchFinalSummaryApi,
  generateInterviewQuestions,
  GeminiApiError,
  requestFollowUpApi,
} from '../services/geminiApi'
import { generateHeuristicResults } from '../lib/generateResults'
import { getQuestionsForSession } from '../data/mockData'
import { useAuth } from './AuthContext'

const defaultConfig: InterviewConfig = {
  jobRole: 'Frontend Engineer',
  experienceLevel: 'mid',
  interviewType: 'mixed',
  difficulty: 'medium',
}

const emptyResults: DemoResults = {
  overallScore: 0,
  categories: [],
  strengths: [],
  improvements: [],
  recommendations: [],
}

interface InterviewContextValue {
  config: InterviewConfig
  setConfig: (patch: Partial<InterviewConfig>) => void
  interviewId: string | null
  questions: InterviewQuestion[]
  answers: Record<string, string>
  evaluations: Record<string, AnswerEvaluation>
  lastEvaluation: AnswerEvaluation | null
  setAnswerLocal: (questionId: string, text: string) => void
  persistAnswer: (questionId: string, text: string) => Promise<void>
  currentIndex: number
  setCurrentIndex: (index: number) => void
  sessionBusy: boolean
  sessionError: string | null
  clearSessionError: () => void
  startSession: () => Promise<boolean>
  advanceFromCurrentQuestion: () => Promise<boolean>
  completeSession: () => Promise<boolean>
  resetSession: () => void
  results: DemoResults
  resultsIllustrative: boolean
  loadResultsForInterview: (interviewId: string) => Promise<void>
  retryLastAction: (() => Promise<boolean>) | null
}

const InterviewContext = createContext<InterviewContextValue | null>(null)

export function InterviewProvider({ children }: { children: ReactNode }) {
  const { user, isDemoMode } = useAuth()
  const [config, setConfigState] = useState<InterviewConfig>(defaultConfig)
  const [interviewId, setInterviewId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<InterviewQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [evaluations, setEvaluations] = useState<Record<string, AnswerEvaluation>>({})
  const [lastEvaluation, setLastEvaluation] = useState<AnswerEvaluation | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sessionBusy, setSessionBusy] = useState(false)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [results, setResults] = useState<DemoResults>(emptyResults)
  const [resultsIllustrative, setResultsIllustrative] = useState(true)
  const [retryLastAction, setRetryLastAction] = useState<(() => Promise<boolean>) | null>(
    null,
  )
  const [followUpsUsed, setFollowUpsUsed] = useState(0)

  const setConfig = useCallback((patch: Partial<InterviewConfig>) => {
    setConfigState((prev) => ({ ...prev, ...patch }))
  }, [])

  const clearSessionError = useCallback(() => setSessionError(null), [])

  const setAnswerLocal = useCallback((questionId: string, text: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: text }))
  }, [])

  const persistAnswer = useCallback(
    async (questionId: string, text: string) => {
      if (isDemoMode) return
      if (!interviewId) return
      setSessionError(null)
      try {
        await upsertAnswer(interviewId, questionId, text)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Could not save answer to Supabase.'
        setSessionError(message)
        throw err
      }
    },
    [interviewId, isDemoMode],
  )

  const startSession = useCallback(async () => {
    setSessionBusy(true)
    setSessionError(null)
    setRetryLastAction(null)
    setFollowUpsUsed(0)
    setEvaluations({})
    setLastEvaluation(null)

    const run = async (): Promise<boolean> => {
      if (isDemoMode) {
        const templates = getQuestionsForSession(config.interviewType, config.difficulty)
        const qs: InterviewQuestion[] = templates.map((q, index) => ({
          ...q,
          id: `demo-local-q-${index}`,
        }))
        setInterviewId(`demo-local-interview-${crypto.randomUUID()}`)
        setQuestions(qs)
        setAnswers({})
        setCurrentIndex(0)
        setResults(emptyResults)
        setResultsIllustrative(true)
        return true
      }

      if (!user) {
        setSessionError('You must be signed in to start an interview.')
        return false
      }

      const generated = await generateInterviewQuestions(config)
      const id = await createInterviewRecord(user.id, config)
      const qs = await insertGeneratedQuestions(id, generated)
      setInterviewId(id)
      setQuestions(qs)
      setAnswers({})
      setCurrentIndex(0)
      setResults(emptyResults)
      setResultsIllustrative(false)
      return true
    }

    try {
      return await run()
    } catch (err) {
      const message =
        err instanceof GeminiApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to start interview session.'
      setSessionError(message)
      setRetryLastAction(() => run)
      return false
    } finally {
      setSessionBusy(false)
    }
  }, [config, isDemoMode, user])

  const advanceFromCurrentQuestion = useCallback(async () => {
    const current = questions[currentIndex]
    if (!current) return false

    if (isDemoMode) {
      setCurrentIndex((i) => Math.min(i + 1, questions.length - 1))
      return true
    }

    if (!interviewId) return false

    setSessionBusy(true)
    setSessionError(null)

    const run = async (): Promise<boolean> => {
      const answerText = answers[current.id] ?? ''
      if (!answerText.trim()) {
        setSessionError('Please enter an answer before continuing.')
        return false
      }

      const evaluation = await evaluateAnswerApi(config, current.prompt, answerText)
      setEvaluations((prev) => ({ ...prev, [current.id]: evaluation }))
      setLastEvaluation(evaluation)
      await upsertAnswer(
        interviewId,
        current.id,
        answerText,
        evaluation.summary_feedback,
      )

      let nextQuestions = [...questions]
      let nextIndex = currentIndex + 1

      if (!current.isFollowUp && followUpsUsed < 2) {
        const follow = await requestFollowUpApi(
          config,
          current.prompt,
          answerText,
          currentIndex,
        )
        if (follow.should_ask_follow_up && follow.follow_up) {
          const appended = await appendInterviewQuestion(
            interviewId,
            nextQuestions.length,
            follow.follow_up,
          )
          nextQuestions = [...nextQuestions, appended]
          setFollowUpsUsed((n) => n + 1)
        }
      }

      setQuestions(nextQuestions)
      if (nextIndex < nextQuestions.length) {
        setCurrentIndex(nextIndex)
      }
      return true
    }

    try {
      return await run()
    } catch (err) {
      const message =
        err instanceof GeminiApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Could not evaluate your answer.'
      setSessionError(message)
      setRetryLastAction(() => run)
      return false
    } finally {
      setSessionBusy(false)
    }
  }, [
    answers,
    config,
    currentIndex,
    followUpsUsed,
    interviewId,
    isDemoMode,
    questions,
  ])

  const completeSession = useCallback(async () => {
    if (!interviewId) {
      setSessionError('No active interview session.')
      return false
    }

    setSessionBusy(true)
    setSessionError(null)

    const run = async (): Promise<boolean> => {
      if (isDemoMode) {
        const heuristic = generateHeuristicResults(questions, answers)
        setResults(heuristic)
        setResultsIllustrative(true)
        return true
      }

      const current = questions[currentIndex]
      if (current) {
        const answerText = answers[current.id] ?? ''
        if (answerText.trim() && !evaluations[current.id]) {
          const evaluation = await evaluateAnswerApi(config, current.prompt, answerText)
          setEvaluations((prev) => ({ ...prev, [current.id]: evaluation }))
          await upsertAnswer(
            interviewId,
            current.id,
            answerText,
            evaluation.summary_feedback,
          )
        }
      }

      for (const q of questions) {
        const text = answers[q.id] ?? ''
        if (text.trim()) {
          const feedback = evaluations[q.id]?.summary_feedback
          await upsertAnswer(interviewId, q.id, text, feedback)
        }
      }

      const qaPairs = questions.map((q) => ({
        question: q.prompt,
        answer: answers[q.id] ?? '',
      }))

      const summaryPayload = await fetchFinalSummaryApi(config, qaPairs)
      const demoResults = finalSummaryToDemoResults(summaryPayload)
      const row = await completeInterviewSession(interviewId, demoResults, {
        summary: summaryPayload.summary,
        isIllustrative: false,
      })
      setResults(dbResultToDemoResults(row))
      setResultsIllustrative(row.is_illustrative)
      return true
    }

    try {
      return await run()
    } catch (err) {
      const message =
        err instanceof GeminiApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Could not complete interview.'
      setSessionError(message)
      setRetryLastAction(() => run)
      return false
    } finally {
      setSessionBusy(false)
    }
  }, [
    answers,
    config,
    currentIndex,
    evaluations,
    interviewId,
    isDemoMode,
    questions,
  ])

  const loadResultsForInterview = useCallback(
    async (id: string) => {
      if (isDemoMode || id.startsWith('demo-local-')) {
        return
      }
      setSessionBusy(true)
      setSessionError(null)
      try {
        const row = await fetchInterviewResult(id)
        if (!row) {
          setSessionError('No results found for this interview.')
          return
        }
        setResults(dbResultToDemoResults(row))
        setResultsIllustrative(row.is_illustrative)
        setInterviewId(id)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not load results.'
        setSessionError(message)
      } finally {
        setSessionBusy(false)
      }
    },
    [isDemoMode],
  )

  const resetSession = useCallback(() => {
    setInterviewId(null)
    setQuestions([])
    setAnswers({})
    setEvaluations({})
    setLastEvaluation(null)
    setCurrentIndex(0)
    setResults(emptyResults)
    setResultsIllustrative(true)
    setSessionError(null)
    setRetryLastAction(null)
    setFollowUpsUsed(0)
  }, [])

  const value = useMemo(
    () => ({
      config,
      setConfig,
      interviewId,
      questions,
      answers,
      evaluations,
      lastEvaluation,
      setAnswerLocal,
      persistAnswer,
      currentIndex,
      setCurrentIndex,
      sessionBusy,
      sessionError,
      clearSessionError,
      startSession,
      advanceFromCurrentQuestion,
      completeSession,
      resetSession,
      results,
      resultsIllustrative,
      loadResultsForInterview,
      retryLastAction,
    }),
    [
      config,
      setConfig,
      interviewId,
      questions,
      answers,
      evaluations,
      lastEvaluation,
      setAnswerLocal,
      persistAnswer,
      currentIndex,
      sessionBusy,
      sessionError,
      clearSessionError,
      startSession,
      advanceFromCurrentQuestion,
      completeSession,
      resetSession,
      results,
      resultsIllustrative,
      loadResultsForInterview,
      retryLastAction,
    ],
  )

  return (
    <InterviewContext.Provider value={value}>{children}</InterviewContext.Provider>
  )
}

export function useInterview() {
  const ctx = useContext(InterviewContext)
  if (!ctx) {
    throw new Error('useInterview must be used within InterviewProvider')
  }
  return ctx
}

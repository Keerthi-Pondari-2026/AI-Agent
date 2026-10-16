import { useCallback, useEffect, useRef, useState } from 'react'

type SpeechStatus = 'idle' | 'speaking' | 'listening'

export function useInterviewSpeech() {
  const [speechEnabled, setSpeechEnabled] = useState(true)
  const [autoListenAfterSpeak, setAutoListenAfterSpeak] = useState(true)
  const [status, setStatus] = useState<SpeechStatus>('idle')
  const [liveTranscript, setLiveTranscript] = useState('')
  const [speechSupported, setSpeechSupported] = useState(true)
  const [recognitionSupported, setRecognitionSupported] = useState(true)
  const recognitionRef = useRef<{ stop: () => void } | null>(null)

  useEffect(() => {
    setSpeechSupported(typeof window !== 'undefined' && 'speechSynthesis' in window)
    const rec =
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    setRecognitionSupported(rec)
    if (!('speechSynthesis' in window)) setSpeechEnabled(false)
  }, [])

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setStatus((s) => (s === 'speaking' ? 'idle' : s))
  }, [])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setStatus((s) => (s === 'listening' ? 'idle' : s))
  }, [])

  const speakQuestion = useCallback(
    (text: string, onComplete?: () => void) => {
      if (!speechEnabled || !speechSupported) {
        onComplete?.()
        return
      }
      stopListening()
      stopSpeaking()
      const utter = new SpeechSynthesisUtterance(text)
      utter.rate = 0.95
      utter.onstart = () => setStatus('speaking')
      utter.onend = () => {
        setStatus('idle')
        onComplete?.()
      }
      utter.onerror = () => {
        setStatus('idle')
        onComplete?.()
      }
      window.speechSynthesis.speak(utter)
    },
    [speechEnabled, speechSupported, stopListening, stopSpeaking],
  )

  const startListening = useCallback(
    (onResult: (text: string) => void) => {
      if (!recognitionSupported) return
      const w = window as Window & {
        SpeechRecognition?: new () => RecognitionInstance
        webkitSpeechRecognition?: new () => RecognitionInstance
      }
      const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition
      if (!Ctor) return

      stopSpeaking()
      const recognition = new Ctor()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'
      recognition.onresult = (event: RecognitionEvent) => {
        let interim = ''
        let finalText = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const part = event.results[i][0].transcript
          if (event.results[i].isFinal) finalText += part
          else interim += part
        }
        setLiveTranscript(finalText || interim)
        if (finalText.trim()) onResult(finalText.trim())
      }
      recognition.onerror = () => setStatus('idle')
      recognition.onend = () => setStatus('idle')
      recognitionRef.current = recognition
      setStatus('listening')
      recognition.start()
    },
    [recognitionSupported, stopSpeaking],
  )

  useEffect(() => {
    return () => {
      stopSpeaking()
      stopListening()
    }
  }, [stopListening, stopSpeaking])

  return {
    speechEnabled,
    setSpeechEnabled,
    autoListenAfterSpeak,
    setAutoListenAfterSpeak,
    status,
    liveTranscript,
    setLiveTranscript,
    speechSupported,
    recognitionSupported,
    speakQuestion,
    startListening,
    stopListening,
    stopSpeaking,
  }
}

interface RecognitionAlternative {
  transcript: string
}
interface RecognitionResult {
  isFinal: boolean
  0: RecognitionAlternative
}
interface RecognitionEvent {
  resultIndex: number
  results: RecognitionResult[]
}
interface RecognitionInstance {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: RecognitionEvent) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

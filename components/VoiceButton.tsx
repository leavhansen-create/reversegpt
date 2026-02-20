'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface VoiceButtonProps {
  onTranscript: (text: string) => void
  disabled?: boolean
}

export default function VoiceButton({ onTranscript, disabled }: VoiceButtonProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef<any>(null)
  const onTranscriptRef = useRef(onTranscript)
  // Ref so the async onend/onerror handlers always see current state
  const isListeningRef = useRef(false)

  useEffect(() => {
    onTranscriptRef.current = onTranscript
  }, [onTranscript])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) return

    setIsSupported(true)

    const recognition = new SpeechRecognition()
    recognition.continuous = true       // Keep mic open across natural pauses
    recognition.interimResults = false  // Emit only finalized segments
    recognition.lang = 'en-US'

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const text = event.results[i][0].transcript.trim()
          if (text) onTranscriptRef.current(text)
        }
      }
    }

    recognition.onerror = (event: any) => {
      // 'no-speech' fires during natural pauses — expected in continuous mode
      if (event.error === 'no-speech') return
      isListeningRef.current = false
      setIsListening(false)
    }

    recognition.onend = () => {
      // Chrome may still end continuous sessions after extended silence.
      // Restart automatically if the user hasn't clicked Stop.
      if (isListeningRef.current) {
        try {
          recognition.start()
        } catch {
          isListeningRef.current = false
          setIsListening(false)
        }
      } else {
        setIsListening(false)
      }
    }

    recognitionRef.current = recognition
  }, [])

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return

    if (isListeningRef.current) {
      isListeningRef.current = false
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      try {
        isListeningRef.current = true
        recognitionRef.current.start()
        setIsListening(true)
      } catch {
        isListeningRef.current = false
        setIsListening(false)
      }
    }
  }, [])

  if (!isSupported) return null

  return (
    <div className="relative inline-flex">
      {/* Expanding ring pulse while recording */}
      {isListening && (
        <span className="absolute inset-0 rounded-lg bg-red-500/25 animate-voice-ring pointer-events-none" />
      )}

      <button
        type="button"
        onClick={toggleListening}
        disabled={disabled}
        title={isListening ? 'Stop recording' : 'Speak your answer'}
        className={`
          relative flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-200
          ${
            isListening
              ? 'border-red-600 bg-red-600/15 text-red-500'
              : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
          }
          disabled:opacity-30 disabled:cursor-not-allowed
          focus:outline-none
        `}
      >
        {isListening ? (
          /* Animated waveform bars */
          <span className="flex items-end gap-px h-4">
            {([0, 150, 75] as number[]).map((delay) => (
              <span
                key={delay}
                className="w-0.5 rounded-full bg-red-500 animate-voice-wave"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </span>
        ) : (
          <svg
            width="15"
            height="15"
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M8 1a2.5 2.5 0 0 1 2.5 2.5v5a2.5 2.5 0 0 1-5 0v-5A2.5 2.5 0 0 1 8 1z" />
            <path d="M3.5 8a.5.5 0 0 1 .5.5A4 4 0 0 0 12 8.5a.5.5 0 0 1 1 0 5 5 0 0 1-4.5 4.975V15h1.5a.5.5 0 0 1 0 1h-4a.5.5 0 0 1 0-1H8v-1.525A5 5 0 0 1 3 8.5a.5.5 0 0 1 .5-.5z" />
          </svg>
        )}
      </button>
    </div>
  )
}

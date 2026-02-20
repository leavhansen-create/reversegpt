'use client'

import { Suspense, useEffect, useRef, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import VoiceButton from '@/components/VoiceButton'
import { saveSession, scoreToRank } from '@/lib/storage'
import type { SavedSession } from '@/lib/storage'

// ---------- Types ----------

interface Score {
  value: number
  rank: string
}

interface Message {
  role: 'professor' | 'user'
  content: string
  score?: Score
}

interface ApiMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ArgFields {
  claim: string
  evidence: string
  assumptions: string
  counterarguments: string
}

// ---------- Helpers ----------

async function readStream(
  response: Response,
  onChunk: (accumulated: string) => void
): Promise<string> {
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let fullText = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    fullText += decoder.decode(value, { stream: true })
    onChunk(fullText)
  }

  return fullText
}

function parseAndStripScore(text: string): { content: string; score?: Score } {
  const match = text.match(/\n?\[SCORE:\s*(\d+)\/100\s*\|\s*RANK:\s*([^\]\n]+)\]\s*$/)
  if (!match) return { content: text }
  return {
    content: text.slice(0, match.index).trimEnd(),
    score: {
      value: Math.min(100, Math.max(0, parseInt(match[1]))),
      rank: match[2].trim().toUpperCase(),
    },
  }
}

// ---------- Sub-components ----------

function ThinkingDots() {
  return (
    <span className="flex items-center gap-1 h-5">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-dots"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  )
}

function rankColor(rank: string): string {
  switch (rank) {
    case 'S': return 'text-amber-400'
    case 'A': return 'text-green-400'
    case 'B': return 'text-blue-400'
    case 'C': return 'text-zinc-300'
    case 'D': return 'text-orange-400'
    case 'F': return 'text-red-500'
    default:   return 'text-zinc-600'
  }
}

function rankBarColor(rank: string): string {
  switch (rank) {
    case 'S': return 'bg-amber-500'
    case 'A': return 'bg-green-500'
    case 'B': return 'bg-blue-500'
    case 'C': return 'bg-zinc-400'
    case 'D': return 'bg-orange-500'
    case 'F': return 'bg-red-600'
    default:   return 'bg-zinc-700'
  }
}

function ScoreBadge({ score }: { score: Score }) {
  return (
    <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center gap-3">
      <span className={`text-xs font-bold font-mono w-8 ${rankColor(score.rank)}`}>
        {score.rank}
      </span>
      <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${rankBarColor(score.rank)}`}
          style={{ width: `${score.value}%` }}
        />
      </div>
      <span className="text-xs text-zinc-500 font-mono tabular-nums">{score.value}/100</span>
    </div>
  )
}

function MessageBubble({
  message,
  isStreaming,
}: {
  message: Message
  isStreaming?: boolean
}) {
  const isProfessor = message.role === 'professor'
  const isEmpty = message.content === ''

  return (
    <div
      className={`flex flex-col ${isProfessor ? 'items-start' : 'items-end'} max-w-3xl ${
        isProfessor ? 'mr-auto' : 'ml-auto w-full'
      }`}
    >
      {isProfessor && (
        <div className="flex items-center gap-2 mb-2 ml-1">
          <div className="w-0.5 h-4 bg-red-600 rounded-full" />
          <span className="text-[10px] font-semibold text-red-600 uppercase tracking-widest">
            The Professor
          </span>
        </div>
      )}

      <div
        className={`
          rounded-lg px-5 py-4 text-sm leading-relaxed whitespace-pre-wrap
          ${
            isProfessor
              ? 'bg-zinc-900 border border-zinc-800 text-zinc-200 w-full'
              : 'bg-zinc-800/60 border border-zinc-700/60 text-zinc-300 max-w-xl'
          }
        `}
      >
        {isEmpty && isStreaming ? (
          <ThinkingDots />
        ) : (
          <>
            {message.content}
            {isStreaming && message.content && (
              <span className="inline-block w-px h-4 bg-red-500 ml-0.5 animate-cursor-blink" />
            )}
          </>
        )}

        {message.score && !isStreaming && <ScoreBadge score={message.score} />}
      </div>

      {!isProfessor && (
        <span className="text-[10px] text-zinc-700 mt-1.5 mr-1">You</span>
      )}
    </div>
  )
}

// ---------- Weakness Report Panel ----------

function WeaknessPanel({
  content,
  isLoading,
}: {
  content: string
  isLoading: boolean
}) {
  return (
    <div className="max-w-3xl mr-auto">
      <div className="flex items-center gap-2 mb-2 ml-1">
        <div className="w-0.5 h-4 bg-amber-600 rounded-full" />
        <span className="text-[10px] font-semibold text-amber-600 uppercase tracking-widest">
          Weakness Report
        </span>
      </div>
      <div className="bg-amber-950/20 border border-amber-900/40 rounded-lg px-5 py-4">
        {isLoading && content === '' ? (
          <ThinkingDots />
        ) : (
          <p className="text-amber-200/80 text-xs leading-relaxed whitespace-pre-wrap font-mono">
            {content}
            {isLoading && content && (
              <span className="inline-block w-px h-4 bg-amber-500 ml-0.5 animate-cursor-blink" />
            )}
          </p>
        )}
      </div>
    </div>
  )
}

// ---------- Final Assessment Panel ----------

function FinalAssessmentPanel({
  content,
  isLoading,
}: {
  content: string
  isLoading: boolean
}) {
  const gradeMatch = !isLoading ? content.match(/OVERALL GRADE:\s*([A-Za-z]+)/) : null
  const grade = gradeMatch ? gradeMatch[1].toUpperCase() : null

  return (
    <div className="max-w-3xl mr-auto">
      <div className="flex items-center gap-2 mb-2 ml-1">
        <div className="w-0.5 h-4 bg-violet-600 rounded-full" />
        <span className="text-[10px] font-semibold text-violet-600 uppercase tracking-widest">
          Final Assessment
        </span>
        {grade && (
          <span className={`ml-1 text-sm font-bold font-mono ${rankColor(grade)}`}>
            {grade}
          </span>
        )}
      </div>
      <div className="bg-zinc-900 border border-violet-900/40 rounded-xl px-5 py-5">
        {isLoading && !content ? (
          <ThinkingDots />
        ) : (
          <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
            {content}
            {isLoading && content && (
              <span className="inline-block w-px h-4 bg-violet-500 ml-0.5 animate-cursor-blink" />
            )}
          </p>
        )}
      </div>
    </div>
  )
}

// ---------- Argument Builder ----------

function ArgBuilder({
  fields,
  onChange,
  onCompose,
  onClose,
}: {
  fields: ArgFields
  onChange: (key: keyof ArgFields, value: string) => void
  onCompose: () => void
  onClose: () => void
}) {
  const hasContent = Object.values(fields).some((v) => v.trim())
  return (
    <div className="mb-3 bg-zinc-900 border border-zinc-700/60 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] text-zinc-500 uppercase tracking-widest">
          Argument Builder
        </span>
        <button
          onClick={onClose}
          className="text-zinc-700 hover:text-zinc-400 transition-colors text-sm focus:outline-none"
          aria-label="Close"
        >
          ×
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {(
          [
            { key: 'claim' as const, label: 'Claim', placeholder: 'Your core position…' },
            { key: 'evidence' as const, label: 'Evidence', placeholder: 'Facts, examples, data…' },
            { key: 'assumptions' as const, label: 'Assumptions', placeholder: "What you're taking for granted\u2026" },
            { key: 'counterarguments' as const, label: 'Anticipated counters', placeholder: 'Objections you expect…' },
          ]
        ).map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="block text-[10px] text-zinc-600 mb-1">{label}</label>
            <textarea
              value={fields[key]}
              onChange={(e) => onChange(key, e.target.value)}
              placeholder={placeholder}
              rows={2}
              className="w-full bg-zinc-800 border border-zinc-700/60 rounded px-2.5 py-2 text-xs text-zinc-200 placeholder-zinc-700 resize-none focus:outline-none focus:border-zinc-500 transition-colors leading-relaxed"
            />
          </div>
        ))}
      </div>
      <div className="flex justify-end mt-2">
        <button
          onClick={onCompose}
          disabled={!hasContent}
          className="px-3 py-1.5 text-xs bg-zinc-700 text-zinc-200 rounded hover:bg-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus:outline-none"
        >
          Compose →
        </button>
      </div>
    </div>
  )
}

// ---------- Difficulty selector ----------

const DIFFICULTIES = ['High School', 'Undergraduate', 'Graduate', 'Expert'] as const
type Difficulty = (typeof DIFFICULTIES)[number]

const DIFF_ABBR: Record<Difficulty, string> = {
  'High School': 'HS',
  Undergraduate: 'UG',
  Graduate: 'Grad',
  Expert: 'Expert',
}

// ---------- Chat Content ----------

function ChatContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const category = searchParams.get('category') || 'Philosophy'
  const mode = searchParams.get('mode') || ''
  const topicParam = searchParams.get('topic') || ''

  const isDebateMode = mode === 'debate'
  const isCustomArgMode = mode === 'custom-argument'
  const isCustomTopicMode = mode === 'custom-topic'

  const displayTopic = isCustomTopicMode && topicParam ? topicParam : category

  // Stable session ID for this page load
  const sessionId = useRef(
    `session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  ).current

  const [difficulty, setDifficulty] = useState<Difficulty>('Undergraduate')
  const [messages, setMessages] = useState<Message[]>([])
  const [apiHistory, setApiHistory] = useState<ApiMessage[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [scores, setScores] = useState<number[]>([])
  const [patterns, setPatterns] = useState<string[]>([])

  // Argument Builder
  const [showArgBuilder, setShowArgBuilder] = useState(false)
  const [argFields, setArgFields] = useState<ArgFields>({
    claim: '',
    evidence: '',
    assumptions: '',
    counterarguments: '',
  })

  // Weakness Report
  const [weaknessReport, setWeaknessReport] = useState<string | null>(null)
  const [isLoadingWeakness, setIsLoadingWeakness] = useState(false)

  // Final Assessment
  const [finalAssessment, setFinalAssessment] = useState<string | null>(null)
  const [isLoadingFinalAssessment, setIsLoadingFinalAssessment] = useState(false)

  // Share toast
  const [shareToast, setShareToast] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Ref for save-on-exit — always holds latest values without stale closures
  const saveDataRef = useRef({
    messages: [] as Message[],
    scores: [] as number[],
    patterns: [] as string[],
    difficulty: 'Undergraduate' as Difficulty,
  })
  useEffect(() => {
    saveDataRef.current = { messages, scores, patterns, difficulty }
  }, [messages, scores, patterns, difficulty])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingContent, weaknessReport, finalAssessment, scrollToBottom])

  const sessionAvg =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null

  const userMessageCount = messages.filter((m) => m.role === 'user').length
  const showWeaknessButton =
    userMessageCount >= 3 && weaknessReport === null && !isLoadingWeakness && !isStreaming
  const showFinalAssessmentButton =
    userMessageCount >= 1 && finalAssessment === null && !isLoadingFinalAssessment

  // ---------- Save helpers ----------

  const buildSavedSession = useCallback((): SavedSession => {
    const { messages: msgs, scores: sc, patterns: pt, difficulty: diff } = saveDataRef.current
    const avgScore =
      sc.length > 0 ? Math.round(sc.reduce((a, b) => a + b, 0) / sc.length) : null
    return {
      id: sessionId,
      topic: displayTopic,
      mode,
      difficulty: diff,
      date: new Date().toISOString(),
      messages: msgs,
      scores: sc,
      avgScore,
      rank: avgScore !== null ? scoreToRank(avgScore) : null,
      patterns: pt,
    }
  }, [sessionId, displayTopic, mode])

  const maybeSave = useCallback(() => {
    const userCount = saveDataRef.current.messages.filter(
      (m) => m.role === 'user'
    ).length
    if (userCount >= 2) {
      saveSession(buildSavedSession())
    }
  }, [buildSavedSession])

  // Save on page unload (browser close / refresh)
  useEffect(() => {
    const handler = () => maybeSave()
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [maybeSave])

  // ---------- Generate initial prompt ----------

  useEffect(() => {
    if (isCustomArgMode) return

    let cancelled = false
    setError(null)
    setMessages([])
    setApiHistory([])
    setScores([])
    setPatterns([])
    setWeaknessReport(null)
    setFinalAssessment(null)

    const run = async () => {
      setIsStreaming(true)
      setStreamingContent('')

      try {
        const effectiveCategory = isCustomTopicMode
          ? topicParam || category
          : category

        const response = await fetch('/api/generate-prompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category: effectiveCategory, difficulty, mode }),
        })

        if (!response.ok || !response.body) {
          const text = await response.text().catch(() => '')
          throw new Error(`Server error ${response.status}${text ? `: ${text}` : ''}`)
        }

        let fullText = ''
        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done || cancelled) break
          fullText += decoder.decode(value, { stream: true })
          if (!cancelled && !fullText.startsWith('__API_ERROR__:')) {
            setStreamingContent(fullText)
          }
        }

        if (cancelled) return

        if (fullText.startsWith('__API_ERROR__:')) {
          throw new Error(fullText.slice('__API_ERROR__:'.length))
        }

        setMessages([{ role: 'professor', content: fullText }])
        setApiHistory([
          {
            role: 'user',
            content: `Generate a challenging intellectual question on the topic: ${effectiveCategory}`,
          },
          { role: 'assistant', content: fullText },
        ])
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to connect to The Professor.'
          )
        }
      } finally {
        if (!cancelled) {
          setIsStreaming(false)
          setStreamingContent('')
        }
      }
    }

    run()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, mode, topicParam, retryCount])

  // ---------- Pattern detection (background, after each critique) ----------

  const detectPatterns = useCallback(
    async (fullHistory: ApiMessage[]) => {
      try {
        // Build a readable transcript; skip the initial meta-request in regular mode
        const slice = isCustomArgMode ? fullHistory : fullHistory.slice(1)
        const transcript = slice
          .map((m) =>
            m.role === 'assistant'
              ? `PROFESSOR: ${m.content}`
              : `STUDENT: ${m.content}`
          )
          .join('\n\n')

        const res = await fetch('/api/detect-patterns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              {
                role: 'user',
                content: `Analyze the following tutoring conversation and identify recurring reasoning patterns in the STUDENT's responses:\n\n${transcript}`,
              },
            ],
          }),
        })

        if (!res.ok) return
        const data = await res.json()
        if (Array.isArray(data.patterns) && data.patterns.length > 0) {
          setPatterns(data.patterns as string[])
        }
      } catch {
        // Pattern detection is non-critical — fail silently
      }
    },
    [isCustomArgMode]
  )

  // ---------- Submit answer ----------

  const submitAnswer = async () => {
    const userAnswer = input.trim()
    if (!userAnswer || isStreaming) return

    setInput('')
    setError(null)

    const newMessages: Message[] = [
      ...messages,
      { role: 'user', content: userAnswer },
    ]
    setMessages(newMessages)

    const newApiHistory: ApiMessage[] =
      isCustomArgMode && messages.length === 0
        ? [{ role: 'user', content: userAnswer }]
        : [...apiHistory, { role: 'user', content: userAnswer }]

    setIsStreaming(true)
    setStreamingContent('')

    try {
      const response = await fetch('/api/critique', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newApiHistory, difficulty, mode }),
      })

      if (!response.ok || !response.body) {
        throw new Error(`Server error ${response.status}`)
      }

      const fullText = await readStream(response, (text) => {
        const withoutScore = text.replace(
          /\n?\[SCORE:\s*\d+\/100\s*\|\s*RANK:\s*[^\]\n]+\]\s*$/,
          ''
        )
        if (!text.startsWith('__API_ERROR__:')) {
          setStreamingContent(withoutScore)
        }
      })

      if (fullText.startsWith('__API_ERROR__:')) {
        throw new Error(fullText.slice('__API_ERROR__:'.length))
      }

      const { content, score } = parseAndStripScore(fullText)
      const professorMsg: Message = { role: 'professor', content, score }
      const updatedApiHistory: ApiMessage[] = [...newApiHistory, { role: 'assistant' as const, content: fullText }]

      setMessages([...newMessages, professorMsg])
      setApiHistory(updatedApiHistory)

      if (score) {
        setScores((prev) => [...prev, score.value])
      }

      // Fire-and-forget pattern detection after each critique
      detectPatterns(updatedApiHistory)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'The Professor encountered an error.'
      )
    } finally {
      setIsStreaming(false)
      setStreamingContent('')
    }
  }

  // ---------- Final Assessment ----------

  const handleFinalAssessment = async () => {
    setIsLoadingFinalAssessment(true)
    setFinalAssessment('')

    const transcript = messages
      .map((m) =>
        m.role === 'professor'
          ? `THE PROFESSOR: ${m.content}`
          : `STUDENT: ${m.content}`
      )
      .join('\n\n')

    const assessmentMessages: ApiMessage[] = [
      {
        role: 'user',
        content: `Please provide a final assessment of this student's performance in our session:\n\n${transcript}`,
      },
    ]

    try {
      const response = await fetch('/api/final-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: assessmentMessages }),
      })

      if (!response.ok || !response.body) {
        throw new Error(`Server error ${response.status}`)
      }

      const fullText = await readStream(response, (text) => {
        if (!text.startsWith('__API_ERROR__:')) setFinalAssessment(text)
      })

      if (fullText.startsWith('__API_ERROR__:')) {
        throw new Error(fullText.slice('__API_ERROR__:'.length))
      }

      setFinalAssessment(fullText)
    } catch (err) {
      setFinalAssessment(
        `Error: ${err instanceof Error ? err.message : 'Failed to generate assessment.'}`
      )
    } finally {
      setIsLoadingFinalAssessment(false)
    }
  }

  // ---------- Weakness Report ----------

  const handleWeaknessReport = async () => {
    setIsLoadingWeakness(true)
    setWeaknessReport('')

    const transcript = messages
      .map((m) =>
        m.role === 'professor'
          ? `THE PROFESSOR: ${m.content}`
          : `STUDENT: ${m.content}`
      )
      .join('\n\n')

    const analysisMessages: ApiMessage[] = [
      {
        role: 'user',
        content: `Identify 3 recurring reasoning weaknesses in the student's responses:\n\n${transcript}`,
      },
    ]

    try {
      const response = await fetch('/api/weakness-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: analysisMessages }),
      })

      if (!response.ok || !response.body) throw new Error(`Server error ${response.status}`)

      const fullText = await readStream(response, (text) => {
        if (!text.startsWith('__API_ERROR__:')) setWeaknessReport(text)
      })

      if (fullText.startsWith('__API_ERROR__:')) {
        throw new Error(fullText.slice('__API_ERROR__:'.length))
      }

      setWeaknessReport(fullText)
    } catch (err) {
      setWeaknessReport(
        err instanceof Error ? `Error: ${err.message}` : 'Failed to generate report.'
      )
    } finally {
      setIsLoadingWeakness(false)
    }
  }

  // ---------- Argument Builder ----------

  const updateArgField = (key: keyof ArgFields, value: string) => {
    setArgFields((prev) => ({ ...prev, [key]: value }))
  }

  const composeArgument = () => {
    const parts: string[] = []
    if (argFields.claim.trim()) parts.push(`Claim: ${argFields.claim.trim()}`)
    if (argFields.evidence.trim()) parts.push(`Evidence: ${argFields.evidence.trim()}`)
    if (argFields.assumptions.trim())
      parts.push(`Assumptions: ${argFields.assumptions.trim()}`)
    if (argFields.counterarguments.trim())
      parts.push(`Counterarguments I anticipate: ${argFields.counterarguments.trim()}`)
    setInput(parts.join('\n\n'))
    setShowArgBuilder(false)
    setArgFields({ claim: '', evidence: '', assumptions: '', counterarguments: '' })
    textareaRef.current?.focus()
  }

  // ---------- Share ----------

  const shareSession = async () => {
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    const divider = '\u2500'.repeat(48)
    const lines: string[] = [
      'ReverseGPT Session',
      `Topic: ${displayTopic}  \u00b7  Difficulty: ${difficulty}`,
      date,
      '',
      divider,
      '',
    ]

    for (const m of messages) {
      if (m.role === 'professor') {
        const scoreStr = m.score ? ` [${m.score.value}/100 \u00b7 ${m.score.rank}]` : ''
        lines.push(`THE PROFESSOR${scoreStr}:`)
        lines.push(m.content)
      } else {
        lines.push('YOU:')
        lines.push(m.content)
      }
      lines.push('')
    }

    lines.push(divider)
    if (sessionAvg !== null) lines.push(`Session Average: ${sessionAvg}/100`)
    lines.push('reversegpt.app')

    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      setShareToast(true)
      setTimeout(() => setShareToast(false), 2000)
    } catch {}
  }

  // ---------- Back with save ----------

  const handleBack = () => {
    maybeSave()
    router.push('/')
  }

  // ---------- Input handlers ----------

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submitAnswer()
    }
  }

  const handleVoiceTranscript = useCallback((text: string) => {
    setInput((prev) => (prev ? `${prev} ${text}` : text))
    textareaRef.current?.focus()
  }, [])

  const awaitingUserInput =
    !isStreaming &&
    !error &&
    (
      (messages.length > 0 && messages[messages.length - 1].role === 'professor') ||
      (isCustomArgMode && messages.length === 0)
    )

  const inputPlaceholder = isDebateMode
    ? 'Argue against this\u2026 (Enter to submit, Shift+Enter for newline)'
    : isCustomArgMode && messages.length === 0
    ? 'Write your argument\u2026 (Enter to submit, Shift+Enter for newline)'
    : 'Defend your position\u2026 (Enter to submit, Shift+Enter for newline)'

  // ---------- Render ----------

  return (
    <div className="flex flex-col h-screen bg-zinc-950">
      {/* ── Header ── */}
      <header className="flex-shrink-0 border-b border-zinc-800/80 bg-zinc-950">
        {/* Row 1: nav + title + actions */}
        <div className="flex items-center gap-4 px-6 py-3">
          <button
            onClick={handleBack}
            className="text-zinc-600 hover:text-zinc-300 transition-colors text-sm focus:outline-none"
          >
            ← Back
          </button>

          <div className="flex-1 flex items-center gap-2.5 min-w-0">
            <div className="w-0.5 h-5 bg-red-600 rounded-full flex-shrink-0" />
            <span className="text-sm font-medium text-zinc-300 flex-shrink-0">
              {isDebateMode ? 'Debate Mode' : 'The Professor'}
            </span>
            <span className="text-zinc-700 text-sm flex-shrink-0">&middot;</span>
            <span className="text-zinc-500 text-sm truncate">{displayTopic}</span>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Share */}
            {messages.length > 0 && (
              <div className="relative">
                <button
                  onClick={shareSession}
                  className="text-zinc-600 hover:text-zinc-300 transition-colors text-xs focus:outline-none"
                >
                  Share
                </button>
                {shareToast && (
                  <span className="absolute -bottom-6 right-0 text-[10px] text-green-500 whitespace-nowrap pointer-events-none">
                    Copied!
                  </span>
                )}
              </div>
            )}

            {/* Session average */}
            {sessionAvg !== null && (
              <span className="text-xs font-mono text-zinc-600">
                avg{' '}
                <span
                  className={`font-bold ${rankColor(
                    sessionAvg >= 90 ? 'S'
                      : sessionAvg >= 75 ? 'A'
                      : sessionAvg >= 60 ? 'B'
                      : sessionAvg >= 45 ? 'C'
                      : sessionAvg >= 30 ? 'D' : 'F'
                  )}`}
                >
                  {sessionAvg}
                </span>
              </span>
            )}

            {/* Status dot */}
            <div className="flex items-center gap-1.5">
              <div
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  isStreaming ? 'bg-red-500 animate-pulse' : 'bg-zinc-700'
                }`}
              />
              <span className="text-zinc-600 text-xs">
                {isStreaming ? 'Analysing\u2026' : 'Waiting'}
              </span>
            </div>
          </div>
        </div>

        {/* Row 2: difficulty */}
        <div className="flex items-center gap-1 px-6 pb-2">
          <span className="text-[10px] text-zinc-700 uppercase tracking-widest mr-2">
            Difficulty
          </span>
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`px-2.5 py-0.5 text-[10px] rounded border transition-all duration-150 ${
                difficulty === d
                  ? 'border-red-800/70 bg-red-900/20 text-red-400'
                  : 'border-zinc-800 text-zinc-600 hover:text-zinc-400 hover:border-zinc-700'
              }`}
            >
              {DIFF_ABBR[d]}
            </button>
          ))}
        </div>

        {/* Row 3: detected patterns (only shown when present) */}
        {patterns.length > 0 && (
          <div className="flex items-center gap-2 px-6 pb-2.5 flex-wrap">
            <span className="text-[10px] text-zinc-700 uppercase tracking-widest flex-shrink-0">
              Patterns
            </span>
            {patterns.map((p) => (
              <span
                key={p}
                className="px-2 py-0.5 text-[10px] bg-zinc-800/80 border border-zinc-700/60 text-zinc-500 rounded-full whitespace-nowrap"
              >
                {p}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-7">
        {/* Custom-arg mode: initial prompt */}
        {isCustomArgMode && messages.length === 0 && !isStreaming && !error && (
          <div className="max-w-3xl mr-auto">
            <div className="flex items-center gap-2 mb-2 ml-1">
              <div className="w-0.5 h-4 bg-red-600 rounded-full" />
              <span className="text-[10px] font-semibold text-red-600 uppercase tracking-widest">
                The Professor
              </span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 text-zinc-500 rounded-lg px-5 py-4 text-sm italic">
              Submit your argument. The Professor will critique it.
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {/* Streaming message */}
        {isStreaming && (
          <MessageBubble
            message={{ role: 'professor', content: streamingContent }}
            isStreaming
          />
        )}

        {/* Error */}
        {error && !isStreaming && (
          <div className="max-w-3xl mr-auto">
            <div className="flex items-center gap-2 mb-2 ml-1">
              <div className="w-0.5 h-4 bg-red-800 rounded-full" />
              <span className="text-[10px] font-semibold text-red-700 uppercase tracking-widest">
                Error
              </span>
            </div>
            <div className="bg-red-950/20 border border-red-900/40 rounded-lg px-5 py-4">
              <p className="text-red-400 text-sm leading-relaxed">{error}</p>
              {messages.length === 0 && (
                <button
                  onClick={() => setRetryCount((c) => c + 1)}
                  className="mt-3 text-xs text-red-500 hover:text-red-300 underline underline-offset-2 transition-colors focus:outline-none"
                >
                  Try again
                </button>
              )}
              {(error.toLowerCase().includes('api key') ||
                error.toLowerCase().includes('authentication') ||
                error.toLowerCase().includes('401')) && (
                <p className="mt-2 text-red-600/70 text-xs">
                  Check that{' '}
                  <code className="font-mono bg-red-950/40 px-1 rounded">
                    ANTHROPIC_API_KEY
                  </code>{' '}
                  is set in{' '}
                  <code className="font-mono bg-red-950/40 px-1 rounded">.env.local</code>{' '}
                  and restart the dev server.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Final Assessment */}
        {(finalAssessment !== null || isLoadingFinalAssessment) && (
          <FinalAssessmentPanel
            content={finalAssessment ?? ''}
            isLoading={isLoadingFinalAssessment}
          />
        )}

        {/* Weakness Report */}
        {(weaknessReport !== null || isLoadingWeakness) && (
          <WeaknessPanel
            content={weaknessReport ?? ''}
            isLoading={isLoadingWeakness}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input area ── */}
      {awaitingUserInput && (
        <div className="flex-shrink-0 border-t border-zinc-800/80 px-6 py-4 bg-zinc-950">
          <div className="max-w-3xl mx-auto">
            {/* Arg Builder */}
            {showArgBuilder && (
              <ArgBuilder
                fields={argFields}
                onChange={updateArgField}
                onCompose={composeArgument}
                onClose={() => setShowArgBuilder(false)}
              />
            )}

            {/* Final Assessment CTA — shown above textarea */}
            {showFinalAssessmentButton && (
              <button
                onClick={handleFinalAssessment}
                className="w-full mb-3 py-2 text-xs text-zinc-600 border border-dashed border-zinc-800 rounded-lg hover:border-zinc-600 hover:text-zinc-400 transition-all focus:outline-none"
              >
                Ready for your final assessment? →
              </button>
            )}

            <div className="flex gap-2.5 items-end">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={inputPlaceholder}
                rows={3}
                className="flex-1 bg-zinc-900 border border-zinc-700/80 rounded-lg px-4 py-3 text-sm text-zinc-100 placeholder-zinc-700 resize-none focus:outline-none focus:border-zinc-500 transition-colors leading-relaxed"
              />

              <div className="flex flex-col gap-2 pb-0.5">
                <VoiceButton onTranscript={handleVoiceTranscript} disabled={isStreaming} />
                <button
                  onClick={submitAnswer}
                  disabled={!input.trim() || isStreaming}
                  title="Submit"
                  className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-700 text-white hover:bg-red-600 disabled:opacity-25 disabled:cursor-not-allowed transition-colors focus:outline-none"
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                    <path d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.41.26.001.002 4.995 3.178 3.178 4.995.002.002.26.41a.5.5 0 0 0 .886-.083l6-15Zm-1.833 1.89L6.637 10.07l-.215-.338a.5.5 0 0 0-.154-.154l-.338-.215 7.494-7.494 1.178-.471-.47 1.178Z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Footer: hint + secondary actions */}
            <div className="flex items-center justify-between mt-2">
              <p className="text-zinc-700 text-[11px]">
                The Professor is watching. Choose your words carefully.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowArgBuilder((v) => !v)}
                  className={`px-2.5 py-1 text-[11px] rounded border transition-all focus:outline-none ${
                    showArgBuilder
                      ? 'border-zinc-500 bg-zinc-800 text-zinc-200'
                      : 'border-zinc-700 bg-zinc-900 text-zinc-500 hover:border-zinc-600 hover:bg-zinc-800/60 hover:text-zinc-300'
                  }`}
                >
                  Build Argument
                </button>
                {showWeaknessButton && (
                  <button
                    onClick={handleWeaknessReport}
                    className="px-2.5 py-1 text-[11px] rounded border border-amber-900/60 bg-amber-950/20 text-amber-700 hover:border-amber-700/60 hover:text-amber-500 transition-all focus:outline-none"
                  >
                    Weakness Report
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------- Page Shell ----------

function LoadingShell() {
  return (
    <div className="flex items-center justify-center h-screen bg-zinc-950">
      <span className="text-zinc-700 text-sm">Preparing session\u2026</span>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={<LoadingShell />}>
      <ChatContent />
    </Suspense>
  )
}

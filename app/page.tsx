'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import CategoryCard from '@/components/CategoryCard'
import { loadSessions, clearSessions, scoreToRank } from '@/lib/storage'
import type { SavedSession, SavedMessage } from '@/lib/storage'

const categories = [
  {
    id: 'philosophy',
    name: 'Philosophy',
    description: 'Free will, consciousness, and the nature of reality itself.',
    icon: '⚗',
  },
  {
    id: 'logic',
    name: 'Logic & Reasoning',
    description: 'Paradoxes, fallacies, and the foundations of rational thought.',
    icon: '◈',
  },
  {
    id: 'science',
    name: 'Science',
    description: 'The philosophy of science, unsolved problems, and empirical limits.',
    icon: '◉',
  },
  {
    id: 'ethics',
    name: 'Ethics & Morality',
    description: 'Moral dilemmas, the basis of right and wrong, and ethical systems.',
    icon: '⊕',
  },
  {
    id: 'politics',
    name: 'Politics & Society',
    description: 'Power, justice, democracy, and the social contract.',
    icon: '◎',
  },
  {
    id: 'mathematics',
    name: 'Mathematics',
    description: 'Infinity, undecidability, and the unreasonable effectiveness of math.',
    icon: '∞',
  },
  {
    id: 'history',
    name: 'History',
    description: 'Causation, counterfactuals, and what the past actually teaches us.',
    icon: '◫',
  },
  {
    id: 'surprise',
    name: 'Surprise Me',
    description: 'A curveball from The Professor. Prepare for anything.',
    icon: '?',
  },
]

// ---------- Helpers ----------

function rankColor(rank: string): string {
  switch (rank) {
    case 'S': return 'text-amber-400'
    case 'A': return 'text-green-400'
    case 'B': return 'text-blue-400'
    case 'C': return 'text-zinc-300'
    case 'D': return 'text-orange-400'
    case 'F': return 'text-red-500'
    case 'Bot': return 'text-zinc-600'
    default: return 'text-zinc-500'
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
    default: return 'bg-zinc-700'
  }
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

function mostCommonPattern(sessions: SavedSession[]): string | null {
  const counts: Record<string, number> = {}
  for (const s of sessions) {
    for (const p of s.patterns) {
      counts[p] = (counts[p] || 0) + 1
    }
  }
  const entries = Object.entries(counts)
  if (entries.length === 0) return null
  return entries.sort((a, b) => b[1] - a[1])[0][0]
}

// ---------- Progress Bar Chart ----------

function MiniBarChart({ sessions }: { sessions: SavedSession[] }) {
  const last5 = [...sessions].slice(0, 5).reverse()
  if (last5.length === 0) return null

  return (
    <div className="flex items-end gap-1.5 h-10">
      {last5.map((s, i) => {
        const score = s.avgScore ?? 0
        const rank = s.rank ?? scoreToRank(score)
        const heightPct = Math.max(8, score)
        return (
          <div
            key={i}
            className="flex-1 flex flex-col items-center gap-0.5 group relative"
          >
            <div
              className={`w-full rounded-sm ${rankBarColor(rank)} opacity-70 group-hover:opacity-100 transition-opacity`}
              style={{ height: `${(heightPct / 100) * 40}px` }}
            />
            <span className="text-[9px] text-zinc-700 group-hover:text-zinc-500 transition-colors tabular-nums">
              {score}
            </span>
            {/* tooltip */}
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              {s.topic}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ---------- Session Card ----------

function SessionCard({ session }: { session: SavedSession }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border border-zinc-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left px-4 py-3 hover:bg-zinc-900/60 transition-colors focus:outline-none"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-zinc-400 text-sm font-medium truncate">
              {session.topic}
            </span>
            {session.mode === 'debate' && (
              <span className="text-[9px] text-amber-700 border border-amber-900/50 rounded px-1.5 py-0.5 flex-shrink-0">
                Debate
              </span>
            )}
            {session.mode === 'custom-argument' && (
              <span className="text-[9px] text-blue-700 border border-blue-900/50 rounded px-1.5 py-0.5 flex-shrink-0">
                Custom
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {session.avgScore !== null && (
              <span className={`text-sm font-bold font-mono ${rankColor(session.rank ?? '')}`}>
                {session.rank ?? scoreToRank(session.avgScore)}
              </span>
            )}
            {session.avgScore !== null && (
              <span className="text-xs font-mono text-zinc-600 tabular-nums">
                {session.avgScore}/100
              </span>
            )}
            <span className="text-[11px] text-zinc-700">
              {formatDate(session.date)}
            </span>
            <span className="text-zinc-700 text-xs">
              {expanded ? '▲' : '▼'}
            </span>
          </div>
        </div>

        {/* Metadata row */}
        <div className="flex items-center gap-3 mt-1">
          <span className="text-[10px] text-zinc-700">{session.difficulty}</span>
          <span className="text-zinc-800 text-[10px]">·</span>
          <span className="text-[10px] text-zinc-700">
            {session.messages.filter((m) => m.role === 'user').length} exchanges
          </span>
          {session.patterns.length > 0 && (
            <>
              <span className="text-zinc-800 text-[10px]">·</span>
              <span className="text-[10px] text-zinc-700 truncate">
                {session.patterns.slice(0, 2).join(', ')}
                {session.patterns.length > 2 && ` +${session.patterns.length - 2}`}
              </span>
            </>
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-zinc-800 px-4 py-4 bg-zinc-950 space-y-4">
          {session.messages.map((msg: SavedMessage, i: number) => (
            <div
              key={i}
              className={`flex flex-col ${msg.role === 'professor' ? 'items-start' : 'items-end'}`}
            >
              {msg.role === 'professor' && (
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-0.5 h-3 bg-red-700 rounded-full" />
                  <span className="text-[9px] text-red-700 uppercase tracking-widest">
                    The Professor
                  </span>
                </div>
              )}
              <div
                className={`rounded px-3 py-2.5 text-xs leading-relaxed whitespace-pre-wrap max-w-lg ${
                  msg.role === 'professor'
                    ? 'bg-zinc-900 border border-zinc-800 text-zinc-400'
                    : 'bg-zinc-800/50 border border-zinc-700/40 text-zinc-500'
                }`}
              >
                {msg.content}
                {msg.score && (
                  <div className="mt-2 pt-2 border-t border-zinc-700 flex items-center gap-2">
                    <span className={`text-[10px] font-bold font-mono ${rankColor(msg.score.rank)}`}>
                      {msg.score.rank}
                    </span>
                    <span className="text-[10px] text-zinc-600 font-mono">
                      {msg.score.value}/100
                    </span>
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <span className="text-[9px] text-zinc-700 mt-1">You</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------- Progress Section ----------

function ProgressSection({ sessions }: { sessions: SavedSession[] }) {
  if (sessions.length === 0) return null

  const totalSessions = sessions.length
  const allScores = sessions.flatMap((s) => s.scores)
  const overallAvg =
    allScores.length > 0
      ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
      : null
  const topPattern = mostCommonPattern(sessions)
  const overallRank = overallAvg !== null ? scoreToRank(overallAvg) : null

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-[10px] text-zinc-600 uppercase tracking-widest whitespace-nowrap">
          Your Progress
        </span>
        <div className="flex-1 h-px bg-zinc-800" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {/* Total sessions */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3">
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Sessions</p>
          <p className="text-2xl font-bold text-zinc-300 font-mono">{totalSessions}</p>
        </div>

        {/* Overall avg */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3">
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Overall Avg</p>
          {overallAvg !== null ? (
            <p className={`text-2xl font-bold font-mono ${rankColor(overallRank ?? '')}`}>
              {overallAvg}
            </p>
          ) : (
            <p className="text-2xl font-bold text-zinc-700 font-mono">—</p>
          )}
        </div>

        {/* Overall rank */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3">
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Rank</p>
          {overallRank ? (
            <p className={`text-2xl font-bold font-mono ${rankColor(overallRank)}`}>
              {overallRank}
            </p>
          ) : (
            <p className="text-2xl font-bold text-zinc-700 font-mono">—</p>
          )}
        </div>

        {/* Most common pattern */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3">
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Top Pattern</p>
          {topPattern ? (
            <p className="text-xs text-zinc-400 leading-snug">{topPattern}</p>
          ) : (
            <p className="text-xs text-zinc-700 italic">None yet</p>
          )}
        </div>
      </div>

      {/* Bar chart */}
      {sessions.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3">
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-3">
            Last {Math.min(5, sessions.length)} Sessions
          </p>
          <MiniBarChart sessions={sessions} />
        </div>
      )}
    </div>
  )
}

// ---------- Home Page ----------

export default function Home() {
  const router = useRouter()
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [customTopic, setCustomTopic] = useState('')
  const topicInputRef = useRef<HTMLInputElement>(null)

  // Dashboard state — only populated client-side (localStorage)
  const [sessions, setSessions] = useState<SavedSession[]>([])
  const [dashboardLoaded, setDashboardLoaded] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  useEffect(() => {
    setSessions(loadSessions())
    setDashboardLoaded(true)
  }, [])

  const handleCustomTopic = () => {
    const t = customTopic.trim()
    if (!t) return
    router.push(`/chat?category=Custom&mode=custom-topic&topic=${encodeURIComponent(t)}`)
  }

  const handleCustomArgMode = () => {
    router.push('/chat?category=Custom&mode=custom-argument')
  }

  const openCustomModal = () => {
    setCustomTopic('')
    setShowCustomModal(true)
    setTimeout(() => topicInputRef.current?.focus(), 50)
  }

  const handleClearHistory = () => {
    if (showClearConfirm) {
      clearSessions()
      setSessions([])
      setShowClearConfirm(false)
    } else {
      setShowClearConfirm(true)
    }
  }

  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-16">

        {/* Hero */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-9 bg-red-600 rounded-full" />
            <h1 className="text-4xl font-bold tracking-tight text-zinc-100">
              ReverseGPT
            </h1>
          </div>
          <p className="text-zinc-500 text-base ml-7 leading-relaxed">
            The AI asks. You answer. The Professor tears it apart.
            <br />
            Pick a topic. Defend your reasoning.
          </p>
        </div>

        {/* Special Mode Cards — Debate + Custom */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">

          {/* Debate Mode — amber accent */}
          <button
            onClick={() => router.push('/chat?category=Debate&mode=debate')}
            className="group text-left p-6 rounded-xl border border-amber-900/50 bg-amber-950/20 hover:border-amber-700/70 hover:bg-amber-950/30 transition-all duration-200 focus:outline-none"
          >
            <div className="flex items-start justify-between mb-4">
              <span className="text-3xl leading-none">⇌</span>
              <span className="text-[10px] text-amber-600 uppercase tracking-widest border border-amber-900/60 bg-amber-950/50 px-2 py-0.5 rounded">
                Special
              </span>
            </div>
            <h3 className="text-zinc-100 font-semibold text-base mb-1.5">
              Debate Mode
            </h3>
            <p className="text-amber-800 text-sm leading-relaxed">
              The Professor declares a controversial position. You argue against it. Ground ceded only when your argument demands it.
            </p>
            <div className="mt-5 flex items-center gap-1.5 text-amber-700 text-xs group-hover:text-amber-500 transition-colors">
              <span>Start debate</span>
              <span className="group-hover:translate-x-0.5 transition-transform inline-block">→</span>
            </div>
          </button>

          {/* Custom Prompt — blue accent */}
          <button
            onClick={openCustomModal}
            className="group text-left p-6 rounded-xl border border-blue-900/50 bg-blue-950/20 hover:border-blue-700/70 hover:bg-blue-950/30 transition-all duration-200 focus:outline-none"
          >
            <div className="flex items-start justify-between mb-4">
              <span className="text-3xl leading-none">✎</span>
              <span className="text-[10px] text-blue-600 uppercase tracking-widest border border-blue-900/60 bg-blue-950/50 px-2 py-0.5 rounded">
                Custom
              </span>
            </div>
            <h3 className="text-zinc-100 font-semibold text-base mb-1.5">
              Custom Prompt
            </h3>
            <p className="text-blue-800 text-sm leading-relaxed">
              Name your own topic and get a question on it, or submit an argument directly — The Professor critiques what you bring.
            </p>
            <div className="mt-5 flex items-center gap-1.5 text-blue-700 text-xs group-hover:text-blue-500 transition-colors">
              <span>Choose format</span>
              <span className="group-hover:translate-x-0.5 transition-transform inline-block">→</span>
            </div>
          </button>
        </div>

        {/* Topic Grid */}
        <div className="mb-14">
          {/* Section label */}
          <div className="flex items-center gap-3 mb-5">
            <span className="text-[10px] text-zinc-600 uppercase tracking-widest whitespace-nowrap">
              Choose a Topic
            </span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                name={category.name}
                description={category.description}
                icon={category.icon}
                onClick={() =>
                  router.push(
                    `/chat?category=${encodeURIComponent(category.name)}`
                  )
                }
              />
            ))}
          </div>
        </div>

        {/* Dashboard — only shown once localStorage is read */}
        {dashboardLoaded && sessions.length > 0 && (
          <div>
            {/* Your Progress */}
            <ProgressSection sessions={sessions} />

            {/* Past Sessions */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[10px] text-zinc-600 uppercase tracking-widest whitespace-nowrap">
                  Past Sessions
                </span>
                <div className="flex-1 h-px bg-zinc-800" />
                <button
                  onClick={handleClearHistory}
                  onBlur={() => setShowClearConfirm(false)}
                  className={`text-[10px] uppercase tracking-widest transition-colors focus:outline-none whitespace-nowrap ${
                    showClearConfirm
                      ? 'text-red-500 hover:text-red-400'
                      : 'text-zinc-700 hover:text-zinc-500'
                  }`}
                >
                  {showClearConfirm ? 'Confirm clear' : 'Clear history'}
                </button>
              </div>

              <div className="space-y-2">
                {sessions.map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="mt-14 text-zinc-700 text-xs text-center leading-relaxed">
          The Professor does not grade on a curve. He does not offer partial credit.
          <br />
          He does not care about your feelings. He cares about your reasoning.
        </p>
      </div>

      {/* Custom Prompt Modal */}
      {showCustomModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6"
          onClick={() => setShowCustomModal(false)}
        >
          <div
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-0.5 h-5 bg-blue-600 rounded-full" />
                <h2 className="text-zinc-100 font-semibold text-sm">Custom Session</h2>
              </div>
              <button
                onClick={() => setShowCustomModal(false)}
                className="text-zinc-600 hover:text-zinc-300 transition-colors text-lg leading-none focus:outline-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              {/* Option 1: Topic */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-3">
                  Give me a prompt on…
                </p>
                <div className="flex gap-2">
                  <input
                    ref={topicInputRef}
                    type="text"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCustomTopic()}
                    placeholder="e.g. free will, moral luck, evolution"
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-zinc-500 transition-colors"
                  />
                  <button
                    onClick={handleCustomTopic}
                    disabled={!customTopic.trim()}
                    className="px-4 py-2 bg-blue-700 text-white text-sm rounded-md hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus:outline-none"
                  >
                    Go
                  </button>
                </div>
                <p className="text-[11px] text-zinc-700 mt-2">
                  The Professor will generate a challenging question on your topic.
                </p>
              </div>

              {/* Option 2: Critique argument */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">
                  Critique my argument
                </p>
                <p className="text-[11px] text-zinc-700 mb-3 leading-relaxed">
                  Write your own argument or opinion. The Professor will critique it directly — no question first.
                </p>
                <button
                  onClick={handleCustomArgMode}
                  className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors flex items-center gap-1.5 focus:outline-none group"
                >
                  Start session
                  <span className="group-hover:translate-x-0.5 transition-transform inline-block">→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

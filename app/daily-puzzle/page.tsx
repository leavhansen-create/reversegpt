'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../lib/useAuth'
import { PROFESSORS } from '../../lib/professors'

interface Puzzle {
  date: string
  professor: { id: string; name: string; domain: string }
  question: string
}

interface LeaderboardEntry {
  id: string
  displayName: string
  score: number
  bestQuote: string
  timestamp: any
}

export default function DailyPuzzlePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [claim, setClaim] = useState('')
  const [evidence, setEvidence] = useState('')
  const [assumptions, setAssumptions] = useState('')
  const [counters, setCounters] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [critique, setCritique] = useState('')
  const [score, setScore] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [displayName, setDisplayName] = useState('')
  const [showNamePrompt, setShowNamePrompt] = useState(false)
  const [timeLeft, setTimeLeft] = useState('')

  const loadPuzzle = () => {
    setLoading(true)
    setError('')
    fetch('/api/daily-puzzle')
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setError(data.error)
          setLoading(false)
          return
        }
        setPuzzle(data)
        const date = data.date
        if (localStorage.getItem(`dailyPuzzleSubmitted_${date}`)) {
          setCritique(localStorage.getItem(`dailyPuzzleCritique_${date}`) || '')
          const saved = localStorage.getItem(`dailyPuzzleScore_${date}`)
          setScore(saved ? Number(saved) : null)
          setSubmitted(true)
        }
        setLoading(false)
      })
      .catch(err => {
        setError(err.message || 'Failed to load today\'s puzzle.')
        setLoading(false)
      })
  }

  useEffect(() => { loadPuzzle() }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      const midnight = new Date()
      midnight.setHours(24, 0, 0, 0)
      const diff = midnight.getTime() - now.getTime()
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${h}h ${m}m ${s}s`)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleSubmit = async () => {
    if (!claim.trim() || !puzzle) return
    setSubmitting(true)

    const answer = [
      `CLAIM: ${claim.trim()}`,
      `EVIDENCE: ${evidence.trim()}`,
      `ASSUMPTIONS: ${assumptions.trim()}`,
      `ANTICIPATED COUNTERS: ${counters.trim()}`,
    ].join('\n\n')

    const res = await fetch('/api/daily-puzzle/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        answer,
        question: puzzle.question,
        professor: puzzle.professor,
        date: puzzle.date,
        userId: user?.uid || 'anonymous',
        displayName: displayName || user?.displayName || 'Anonymous',
      })
    })

    const data = await res.json()
    setCritique(data.critique)
    setScore(data.score)
    setLeaderboard(data.leaderboard)
    setSubmitted(true)
    setSubmitting(false)
    // Persist result to localStorage
    localStorage.setItem('dailyPuzzleSolved_' + puzzle.date, 'true')
    localStorage.setItem('dailyPuzzleSubmitted_' + puzzle.date, 'true')
    localStorage.setItem('dailyPuzzleCritique_' + puzzle.date, data.critique)
    localStorage.setItem('dailyPuzzleScore_' + puzzle.date, String(data.score))
  }

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <p className="text-zinc-500 text-sm">Loading today's puzzle...</p>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
      <div className="text-center">
        <p className="text-red-500 text-sm mb-2">Failed to load today's puzzle</p>
        <p className="text-zinc-600 text-xs">{error}</p>
        <button
          onClick={loadPuzzle}
          className="mt-4 text-zinc-500 hover:text-zinc-300 text-xs underline transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => router.push('/')} className="text-zinc-600 hover:text-zinc-300 text-sm">← Back</button>
        </div>

        <div className="flex items-center gap-5 mb-8">
          {puzzle && (() => {
            const prof = PROFESSORS[puzzle.professor.id]
            return prof ? (
              <img src={`/professors/${prof.id}.png`} alt={prof.name} style={{width: 80, height: 80, objectFit: 'contain'}} className="flex-shrink-0" />
            ) : null
          })()}
          <div>
            <div className="text-[10px] text-amber-500 uppercase tracking-widest mb-1">Daily Puzzle</div>
            <h1 className="text-2xl font-bold">Today's Challenge</h1>
            <p className="text-zinc-500 text-sm mt-1">with {puzzle?.professor.name} · Resets in {timeLeft}</p>
          </div>
        </div>

        {/* Question */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
          <p className="text-zinc-200 text-base leading-relaxed">{puzzle?.question}</p>
        </div>

        {!submitted ? (
          <>
            {/* Name prompt for non-logged-in users */}
            {!user && (
              <input
                type="text"
                placeholder="Your name (optional)"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 mb-3 focus:outline-none focus:border-zinc-600"
              />
            )}

            {/* Structured argument builder */}
            <div className="space-y-3 mb-4">
              {[
                { label: 'Claim', sublabel: 'Your core position', value: claim, set: setClaim, placeholder: 'State your central thesis or position clearly.' },
                { label: 'Evidence', sublabel: 'Facts, examples, data', value: evidence, set: setEvidence, placeholder: 'What concrete evidence supports your claim?' },
                { label: 'Assumptions', sublabel: "What you're taking for granted", value: assumptions, set: setAssumptions, placeholder: 'What premises must be true for your argument to hold?' },
                { label: 'Anticipated Counters', sublabel: 'Objections you expect', value: counters, set: setCounters, placeholder: "What's the strongest objection, and how do you address it?" },
              ].map(({ label, sublabel, value, set, placeholder }) => (
                <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-[10px] text-amber-500 uppercase tracking-widest font-semibold">{label}</span>
                    <span className="text-[10px] text-zinc-600">{sublabel}</span>
                  </div>
                  <textarea
                    value={value}
                    onChange={e => set(e.target.value)}
                    placeholder={placeholder}
                    rows={3}
                    className="w-full bg-transparent text-sm text-zinc-200 placeholder-zinc-700 focus:outline-none resize-none"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || !claim.trim()}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-semibold rounded-xl transition-all text-sm"
            >
              {submitting ? 'The Professor is reading...' : 'Submit to the Professor →'}
            </button>
          </>
        ) : (
          <>
            {/* Score */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Professor's Verdict</span>
                <span className={`text-2xl font-bold font-mono ${score && score >= 80 ? 'text-green-400' : score && score >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                  {score}/100
                </span>
              </div>
              <p className="text-zinc-300 text-sm leading-relaxed">{critique}</p>
            </div>

            {/* Leaderboard */}
            <div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-4">Today's Leaderboard</div>
              <div className="space-y-3">
                {leaderboard.map((entry, i) => (
                  <div key={entry.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-start gap-4">
                    <span className={`text-lg font-bold font-mono flex-shrink-0 ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-zinc-400' : i === 2 ? 'text-amber-700' : 'text-zinc-600'}`}>
                      #{i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-zinc-300 text-sm font-medium">{entry.displayName}</span>
                        <span className={`text-sm font-bold font-mono ${entry.score >= 80 ? 'text-green-400' : entry.score >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                          {entry.score}/100
                        </span>
                      </div>
                      <p className="text-zinc-500 text-xs leading-relaxed italic">"{entry.bestQuote}"</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

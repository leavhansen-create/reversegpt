'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LeaderboardPage() {
  const router = useRouter()
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    fetch('/api/daily-puzzle/leaderboard?date=' + today)
      .then(r => r.json())
      .then(data => { setLeaderboard(data.leaderboard || []); setLoading(false) })
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <button onClick={() => router.push('/')} className="text-zinc-600 hover:text-zinc-300 text-sm mb-8 block">← Back</button>
        <div className="text-[10px] text-blue-500 uppercase tracking-widest mb-1">Daily Puzzle</div>
        <h1 className="text-2xl font-bold mb-8">Today's Leaderboard</h1>

        {loading ? (
          <p className="text-zinc-500 text-sm">Loading...</p>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry, i) => (
              <div key={entry.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-bold font-mono ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-zinc-400' : i === 2 ? 'text-amber-700' : 'text-zinc-600'}`}>
                      #{i + 1}
                    </span>
                    <span className="text-zinc-200 font-medium">{entry.displayName}</span>
                  </div>
                  <span className={`text-lg font-bold font-mono ${entry.score >= 80 ? 'text-green-400' : entry.score >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                    {entry.score}/100
                  </span>
                </div>
                <p className="text-zinc-500 text-sm italic">"{entry.bestQuote}"</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

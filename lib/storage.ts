export interface SavedMessage {
  role: 'professor' | 'user'
  content: string
  score?: { value: number; rank: string }
}

export interface SavedSession {
  id: string
  topic: string
  mode: string
  difficulty: string
  date: string // ISO string
  messages: SavedMessage[]
  scores: number[]
  avgScore: number | null
  rank: string | null
  patterns: string[]
}

const STORAGE_KEY = 'reversegpt_sessions'

export function scoreToRank(avg: number): string {
  if (avg >= 90) return 'S'
  if (avg >= 75) return 'A'
  if (avg >= 60) return 'B'
  if (avg >= 45) return 'C'
  if (avg >= 30) return 'D'
  return 'F'
}

export function loadSessions(): SavedSession[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as SavedSession[]
  } catch {
    return []
  }
}

export function saveSession(session: SavedSession): void {
  if (typeof window === 'undefined') return
  try {
    const existing = loadSessions()
    const filtered = existing.filter((s) => s.id !== session.id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify([session, ...filtered]))
  } catch {}
}

export function clearSessions(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {}
}

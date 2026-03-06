import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getAdminDb, withTimeout } from '../../../lib/firebaseAdmin'

const client = new Anthropic()

export async function GET() {
  // --- Diagnostic logging (remove once issue is resolved) ---
  const rawKey = process.env.FIREBASE_PRIVATE_KEY
  console.log('[daily-puzzle] env check:', {
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || '(missing)',
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || '(missing)',
    FIREBASE_PRIVATE_KEY_defined: !!rawKey,
    FIREBASE_PRIVATE_KEY_length: rawKey?.length,
    FIREBASE_PRIVATE_KEY_starts: rawKey?.slice(0, 27),          // "-----BEGIN PRIVATE KEY-----"
    FIREBASE_PRIVATE_KEY_has_literal_slash_n: rawKey?.includes('\\n'),  // true if NOT yet expanded
    FIREBASE_PRIVATE_KEY_has_real_newline: rawKey?.includes('\n'),       // true if already expanded
  })
  // ----------------------------------------------------------

  try {
    console.log('[daily-puzzle] calling getAdminDb()')
    const db = getAdminDb()
    console.log('[daily-puzzle] getAdminDb() succeeded, fetching Firestore doc')
    const today = new Date().toISOString().split('T')[0]
    const docRef = db.collection('dailyPuzzles').doc(today)

    const doc = await withTimeout(docRef.get(), 8000, 'fetch puzzle')
    console.log('[daily-puzzle] today:', today)
    console.log('[daily-puzzle] doc.exists:', doc.exists)
    console.log('[daily-puzzle] doc.data():', JSON.stringify(doc.data(), null, 2))

    if (doc.exists) {
      return NextResponse.json(doc.data())
    }

    // Generate new puzzle
    const professors = [
      { id: 'socrates', name: 'Socrates', domain: 'Philosophy' },
      { id: 'aristotle', name: 'Aristotle', domain: 'Logic & Reasoning' },
      { id: 'einstein', name: 'Einstein', domain: 'Science' },
      { id: 'kant', name: 'Kant', domain: 'Ethics & Morality' },
      { id: 'machiavelli', name: 'Machiavelli', domain: 'Politics & Society' },
      { id: 'nietzsche', name: 'Nietzsche', domain: 'Philosophy & Value' },
      { id: 'darwin', name: 'Darwin', domain: 'Natural History' },
      { id: 'voltaire', name: 'Voltaire', domain: 'Reason & Enlightenment' },
    ]
    const professor = professors[Math.floor(Math.random() * professors.length)]

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Generate a single challenging but accessible philosophical/intellectual question that ${professor.name} would ask. The question should be thought-provoking, debatable, and answerable in a few paragraphs. Return ONLY the question, nothing else.`
      }]
    })

    const question = response.content[0].type === 'text' ? response.content[0].text.trim() : ''

    const puzzle = { date: today, professor, question, createdAt: new Date().toISOString() }
    await withTimeout(docRef.set(puzzle), 8000, 'save puzzle')

    return NextResponse.json(puzzle)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Daily puzzle error:', message)
    const status = message.includes('timed out') || message.includes('Missing Firebase') ? 503 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

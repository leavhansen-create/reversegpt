import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getAdminDb, withTimeout } from '../../../../lib/firebaseAdmin'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const { answer, question, professor, date, userId, displayName } = await req.json()

    // Get critique and score from Claude
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `You are ${professor.name}, a demanding professor. A student answered your question.

Question: ${question}

Student's answer: ${answer}

Give a brief but sharp critique (2-3 sentences). Then on a new line write exactly: SCORE: [number 0-100]
Then on a new line write exactly: QUOTE: [the single most interesting or best-written sentence from their answer, under 20 words]`
      }]
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const scoreMatch = text.match(/SCORE:\s*(\d+)/)
    const quoteMatch = text.match(/QUOTE:\s*(.+)/)
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 50
    const bestQuote = quoteMatch ? quoteMatch[1].trim() : answer.slice(0, 80)
    const critique = text.split('SCORE:')[0].trim()

    // Save to Firestore — anonymous users get a unique ID so they don't overwrite each other
    const docId = (!userId || userId === 'anonymous') ? crypto.randomUUID() : userId
    const db = getAdminDb()
    await withTimeout(
      db.collection('puzzleSubmissions').doc(date).collection('entries').doc(docId).set({
        displayName,
        score,
        bestQuote,
        critique,
        userId: docId,
        timestamp: new Date(),
      }),
      8000,
      'save submission'
    )

    // Get leaderboard
    const snapshot = await withTimeout(
      db.collection('puzzleSubmissions').doc(date).collection('entries')
        .orderBy('score', 'desc').limit(20).get(),
      8000,
      'fetch leaderboard'
    )

    const leaderboard = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    return NextResponse.json({ critique, score, bestQuote, leaderboard })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Puzzle submit error:', message)
    const status = message.includes('timed out') || message.includes('Missing Firebase') ? 503 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

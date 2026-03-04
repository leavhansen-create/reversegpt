import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, withTimeout } from '../../../../lib/firebaseAdmin'

export async function GET(req: NextRequest) {
  try {
    const db = getAdminDb()
    const date = req.nextUrl.searchParams.get('date') || new Date().toISOString().split('T')[0]

    const snapshot = await withTimeout(
      db.collection('puzzleSubmissions').doc(date).collection('entries')
        .orderBy('score', 'desc').limit(20).get(),
      8000,
      'fetch leaderboard'
    )

    const leaderboard = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    return NextResponse.json({ leaderboard })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Leaderboard error:', message)
    const status = message.includes('timed out') || message.includes('Missing Firebase') ? 503 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

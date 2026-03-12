import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, withTimeout } from '../../../../lib/firebaseAdmin'
import { getDateNDaysAgoInTimezone } from '../../../../lib/dateUtils'

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    const db = getAdminDb()

    // Build doc refs for the last 90 days (one batch read instead of N sequential reads)
    const refs: FirebaseFirestore.DocumentReference[] = []
    for (let i = 0; i < 90; i++) {
      const dateStr = getDateNDaysAgoInTimezone(i)
      refs.push(
        db.collection('puzzleSubmissions').doc(dateStr).collection('entries').doc(userId)
      )
    }

    const docs = await withTimeout(db.getAll(...refs), 10000, 'streak batch')

    // Count consecutive days from today going back
    let streak = 0
    for (const doc of docs) {
      if (doc.exists) streak++
      else break
    }

    return NextResponse.json({ streak })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Streak error:', message)
    const status = message.includes('timed out') || message.includes('Missing Firebase') ? 503 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

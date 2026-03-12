import { NextResponse } from 'next/server'
import { getAdminDb, withTimeout } from '../../../../../lib/firebaseAdmin'
import { getTodayInTimezone } from '../../../../../lib/dateUtils'

export async function GET() {
  const today = getTodayInTimezone()
  const db = getAdminDb()
  await withTimeout(
    db.collection('dailyPuzzles').doc(today).delete(),
    8000,
    'delete puzzle'
  )
  return NextResponse.json({ deleted: today })
}

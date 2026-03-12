const DEFAULT_TZ = 'America/New_York'

export function getTodayInTimezone(): string {
  const tz = process.env.PUZZLE_TZ || DEFAULT_TZ
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date())
}

export function getDateNDaysAgoInTimezone(n: number): string {
  const tz = process.env.PUZZLE_TZ || DEFAULT_TZ
  const d = new Date()
  d.setDate(d.getDate() - n)
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(d)
}

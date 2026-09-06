// This is an India-only business - "today"/"this week" must mean the
// calendar day in Asia/Kolkata (IST, UTC+5:30, no DST), never whatever
// timezone a viewer's browser happens to be set to. `toISOString()` is
// always UTC regardless of the browser, and plain `new Date().getDate()`
// etc. use the browser's own local timezone - neither is "today in
// India". Getting it from Intl instead is what keeps this in agreement
// with the server's own IST-based `todayIso()`
// (server/src/utils/dateRange.js), including right around midnight IST
// when UTC and local-machine-timezone dates can each disagree with the
// real Indian calendar day.
const BUSINESS_TZ = 'Asia/Kolkata'

const pad = (n) => String(n).padStart(2, '0')

const istPartsFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: BUSINESS_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

// {year, month (1-12), day} for `date` as seen in Asia/Kolkata.
const istParts = (date) => {
  const parts = istPartsFormatter.formatToParts(date)
  const get = (type) => Number(parts.find((p) => p.type === type).value)
  return { year: get('year'), month: get('month'), day: get('day') }
}

const toIsoDate = ({ year, month, day }) => `${year}-${pad(month)}-${pad(day)}`

// Parses an already-known "YYYY-MM-DD" string directly into {y,m,d) -
// never via `new Date(dateStr)`, which the JS spec parses as UTC
// midnight; calling a *local* method like `.getDay()` on that afterwards
// silently shifts the result by a day for anyone not in a UTC+0
// timezone. This is pure calendar arithmetic on a value that's already a
// fixed calendar date, so it needs no timezone conversion at all - see
// shiftDays/dayOfWeek below, same technique.
const parseIsoDate = (dateStr) => {
  const [year, month, day] = dateStr.split('-').map(Number)
  return { year, month, day }
}

// Calendar-only arithmetic on an already-known Y/M/D triple - anchoring
// to UTC internally is just a normalization trick (so month/year
// boundaries roll over correctly), not a timezone conversion.
const shiftDays = ({ year, month, day }, delta) => {
  const d = new Date(Date.UTC(year, month - 1, day + delta))
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() }
}

const dayOfWeek = ({ year, month, day }) => new Date(Date.UTC(year, month - 1, day)).getUTCDay()

export const todayISO = () => toIsoDate(istParts(new Date()))

export const daysAgoISO = (n) => toIsoDate(shiftDays(istParts(new Date()), -n))

// Back-compat alias - existing callers (seed data generators) import this
// name from '@/utils'.
export const daysAgo = daysAgoISO

// Rolling last-`n`-days window including today - the single definition
// every "week" filter (today vs a stored dateStr) should use instead of
// each page rolling its own `(Date.now() - d) / 86400000 <= 7` check,
// which measures wall-clock milliseconds rather than calendar days and
// can disagree with this by up to a day depending on time-of-day. Matches
// resolveDateRange({filter:'week'}) on the server (n=7).
export const isWithinLastNDays = (dateStr, n) => dateStr >= daysAgoISO(n - 1) && dateStr <= todayISO()

// 0 (Sunday) - 6 (Saturday) for an already-known "YYYY-MM-DD" string -
// safe to use instead of `new Date(dateStr).getDay()`, which parses as
// UTC midnight and would shift by a day off UTC+0.
export const dayOfWeekOf = (dateStr) => dayOfWeek(parseIsoDate(dateStr))

// Sunday-start week (inclusive) that `dateStr` falls in, as an ISO date
// string (that week's Sunday). A fixed calendar block, distinct from
// isWithinLastNDays' rolling window - used to group attendance entries so
// a "week_off" entry on one day can suppress the default day for the
// rest of that same week (see AttendanceCalendar.jsx, WorkerAttendance.jsx).
export const weekStartOf = (dateStr) => {
  const parts = parseIsoDate(dateStr)
  return toIsoDate(shiftDays(parts, -dayOfWeek(parts)))
}

// A real calendar date, not just YYYY-MM-DD shape - rejects "2026-99-99",
// "2026-02-30", etc. so a bad custom-range input surfaces as a clear
// validation error client-side rather than an empty/misleading result.
export const isValidCalendarDate = (dateStr) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false
  const { year, month, day } = parseIsoDate(dateStr)
  const d = new Date(Date.UTC(year, month - 1, day))
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day
}

// YYYY-MM-DD sorts the same lexicographically as it does chronologically,
// so plain string comparison is enough - no Date parsing needed.
export const isReversedRange = (from, to) => Boolean(from && to && from > to)

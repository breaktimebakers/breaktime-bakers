export const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// Sunday-start week a date falls in, as an ISO date string (that week's
// Sunday). Used to group attendance entries by week so a "week_off"
// entry on one day can identify/suppress the default weekOffDay for the
// rest of that same week - see AttendanceCalendar.jsx and
// WorkerAttendance.jsx.
export function weekStartOf(dateStr) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() - d.getDay())
  return d.toISOString().slice(0, 10)
}

export function countWeekdaysInMonth(year, month, weekOffDay) {
  let count = 0
  const days = new Date(year, month + 1, 0).getDate()
  for (let d = 1; d <= days; d++) {
    const dow = new Date(year, month, d).getDay()
    if (dayNames[dow] !== weekOffDay) count++
  }
  return count
}

export function dailySalaryFromMonthly(monthlySalary, year, month, weekOffDay) {
  const weekdays = countWeekdaysInMonth(year, month, weekOffDay)
  if (weekdays === 0) return 0
  return (Number(monthlySalary) || 0) / weekdays
}

// Gross salary earned so far for one worker in one (year, month), from
// attendance alone - no advances deducted yet. Shared by the worker
// detail page's pay estimate, Finance's per-worker salary row, and the
// advance cap check, so the present/half/overtime formula lives in
// exactly one place.
export function computeGrossSalaryForMonth(worker, attendance, year, month) {
  const mStr = `${year}-${String(month + 1).padStart(2, '0')}`
  const monthEntries = attendance.filter((a) => a.date.startsWith(mStr))
  const present = monthEntries.filter((a) => a.status === 'present').length
  const half = monthEntries.filter((a) => a.status === 'half_day').length
  const absent = monthEntries.filter((a) => a.status === 'absent').length
  const overtime = monthEntries.reduce((s, a) => s + (a.overtimeHours || 0), 0)
  const dailySalary = dailySalaryFromMonthly(worker.monthlySalary, year, month, worker.weekOffDay)
  const otRate = worker.overtimeRate || 0
  const total = present * dailySalary + half * 0.5 * dailySalary + overtime * otRate
  return { total, present, half, absent, overtime, dailySalary, otRate }
}

// Sum of advances given to a worker within one (year, month).
export function sumAdvancesForMonth(advances, workerId, year, month) {
  const mStr = `${year}-${String(month + 1).padStart(2, '0')}`
  return advances
    .filter((a) => a.workerId === workerId && a.date.startsWith(mStr))
    .reduce((s, a) => s + (Number(a.amount) || 0), 0)
}

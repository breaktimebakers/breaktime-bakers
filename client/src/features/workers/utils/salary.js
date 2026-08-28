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

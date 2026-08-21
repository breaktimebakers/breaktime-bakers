export const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

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

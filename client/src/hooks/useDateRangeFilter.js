import { useCallback, useMemo, useState } from 'react'
import { todayISO, isWithinLastNDays } from '@/utils'

export function useDateRangeFilter(initialMode = 'all') {
  const [dateMode, setDateMode] = useState(initialMode)
  const [specificDate, setSpecificDate] = useState('')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const reset = useCallback(() => {
    setDateMode('all')
    setSpecificDate('')
    setCustomFrom('')
    setCustomTo('')
  }, [])

  const matchesDate = useCallback((date) => {
    if (dateMode === 'today') return date === todayISO()
    if (dateMode === 'week') return isWithinLastNDays(date, 7)
    // No date chosen yet - match nothing rather than silently falling
    // back to "show everything", which would look like the filter isn't
    // working at all.
    if (dateMode === 'specific') return Boolean(specificDate) && date === specificDate
    if (dateMode === 'custom') {
      if (customFrom && date < customFrom) return false
      if (customTo && date > customTo) return false
    }
    return true
  }, [dateMode, specificDate, customFrom, customTo])

  const summary = useMemo(() => {
    if (dateMode === 'all') return null
    if (dateMode === 'today') return 'Today'
    if (dateMode === 'week') return 'This week'
    if (dateMode === 'specific') return specificDate || null
    return customFrom || customTo ? `${customFrom}–${customTo}` : null
  }, [dateMode, specificDate, customFrom, customTo])

  return {
    dateMode, setDateMode,
    specificDate, setSpecificDate,
    customFrom, setCustomFrom,
    customTo, setCustomTo,
    matchesDate, reset, summary,
    isActive: dateMode !== 'all',
  }
}

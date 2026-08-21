import { useCallback, useMemo, useState } from 'react'

const todayISO = () => new Date().toISOString().slice(0, 10)

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
    if (dateMode === 'week') return (new Date() - new Date(date)) / 86400000 <= 7
    if (dateMode === 'specific') return !specificDate || date === specificDate
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

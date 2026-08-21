import { useCallback, useState } from 'react'

const NUMERIC_KEYS = new Set(['quantity', 'fulfilledQty'])

export function useSortableData(initialKey = 'date', initialDir = 'desc') {
  const [sortKey, setSortKey] = useState(initialKey)
  const [sortDir, setSortDir] = useState(initialDir)

  const toggleSort = useCallback((key) => {
    setSortKey((prevKey) => {
      if (prevKey === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
      } else {
        setSortDir('asc')
      }
      return key
    })
  }, [])

  const comparator = useCallback((a, b) => {
    let av = a[sortKey]
    let bv = b[sortKey]
    if (NUMERIC_KEYS.has(sortKey)) { av = Number(av) || 0; bv = Number(bv) || 0 }
    if (av < bv) return sortDir === 'asc' ? -1 : 1
    if (av > bv) return sortDir === 'asc' ? 1 : -1
    return 0
  }, [sortKey, sortDir])

  return { sortKey, sortDir, toggleSort, comparator }
}

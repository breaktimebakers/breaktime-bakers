import { useState } from 'react'

export function usePagination(totalItems, pageSize = 10, resetKey) {
  const [page, setPage] = useState(1)
  const [previousResetKey, setPreviousResetKey] = useState(resetKey)
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const reset = previousResetKey !== resetKey
  const safePage = reset ? 1 : Math.max(1, Math.min(page, totalPages))

  // Keep stored state in sync so a smaller result set cannot leave a stale page.
  if (reset) setPreviousResetKey(resetKey)
  if (page !== safePage) setPage(safePage)

  const start = (safePage - 1) * pageSize
  const end = start + pageSize
  return { page: safePage, setPage, totalPages, start, end }
}

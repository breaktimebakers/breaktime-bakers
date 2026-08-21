import { useState } from 'react'

export function usePagination(totalItems, pageSize = 8) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * pageSize
  const end = start + pageSize
  return { page: safePage, setPage, totalPages, start, end }
}

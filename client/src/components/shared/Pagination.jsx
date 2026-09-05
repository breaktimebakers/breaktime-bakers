import { ChevronLeft, ChevronRight } from 'lucide-react'

export function Pagination({ page, totalPages, onPageChange, totalItems, pageSize }) {
  if (totalItems <= pageSize && page === 1) return null
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalItems)
  const visiblePages = [...new Set([1, page - 1, page, page + 1, totalPages])]
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b)
  const pages = visiblePages.flatMap((p, index) => {
    const previous = visiblePages[index - 1]
    if (index === 0 || p - previous === 1) return [p]
    return p - previous === 2 ? [previous + 1, p] : [`gap-${p}`, p]
  })
  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-espresso/8 px-4 py-3 sm:flex-row">
      <p className="text-xs text-espresso/50">
        Showing {start}–{end} of {totalItems}
      </p>
      <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-1.5">
        <button
          type="button"
          aria-label="Previous page"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-espresso/10 text-espresso/60 hover:bg-crust/40 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((p) => typeof p === 'string' ? (
          <span key={p} aria-hidden="true" className="px-1 text-xs text-espresso/50">…</span>
        ) : (
          <button
            key={p}
            type="button"
            aria-label={`Page ${p}`}
            aria-current={p === page ? 'page' : undefined}
            onClick={() => onPageChange(p)}
            className={`flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-xs font-medium transition ${
              p === page ? 'bg-espresso text-crust' : 'border border-espresso/10 text-espresso/60 hover:bg-crust/40'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          aria-label="Next page"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-espresso/10 text-espresso/60 hover:bg-crust/40 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </nav>
    </div>
  )
}

import { ChevronLeft, ChevronRight } from 'lucide-react'

export function Pagination({ page, totalPages, onPageChange, totalItems, pageSize }) {
  if (totalItems <= pageSize) return null
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalItems)
  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-espresso/8 px-4 py-3 sm:flex-row">
      <p className="text-xs text-espresso/50">
        Showing {start}–{end} of {totalItems}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-espresso/10 text-espresso/60 hover:bg-crust/40 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-xs font-medium transition ${
              p === page ? 'bg-espresso text-crust' : 'border border-espresso/10 text-espresso/60 hover:bg-crust/40'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-espresso/10 text-espresso/60 hover:bg-crust/40 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

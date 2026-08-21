import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

export function SortIcon({ column, sortKey, sortDir }) {
  if (sortKey !== column) return <ArrowUpDown className="h-3 w-3 text-espresso/30" />
  return sortDir === 'asc'
    ? <ArrowUp className="h-3 w-3 text-oven-amber" />
    : <ArrowDown className="h-3 w-3 text-oven-amber" />
}

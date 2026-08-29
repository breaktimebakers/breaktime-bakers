import { ChevronLeft, ChevronRight } from 'lucide-react'

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function MonthFilterBar({ year, month, onChange, extra }) {
  const prevMonth = () => {
    if (month === 0) onChange(year - 1, 11)
    else onChange(year, month - 1)
  }
  const nextMonth = () => {
    if (month === 11) onChange(year + 1, 0)
    else onChange(year, month + 1)
  }

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-bakery border border-espresso/8 bg-proof-cream p-4 shadow-bakery">
      <div className="flex items-center gap-2">
        <button onClick={prevMonth} className="flex h-8 w-8 items-center justify-center rounded-lg border border-espresso/10 text-espresso/60 hover:bg-crust/40">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="min-w-[140px] text-center font-display text-lg font-semibold text-espresso">
          {monthNames[month]} {year}
        </span>
        <button onClick={nextMonth} className="flex h-8 w-8 items-center justify-center rounded-lg border border-espresso/10 text-espresso/60 hover:bg-crust/40">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      {extra}
    </div>
  )
}

export { monthNames }

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useClickOutside } from '@/hooks'
import { ORDER_STATUS } from '@/constants/orderStatus'

export function StatusDropdown({ order, onUpdate }) {
  const [open, setOpen] = useState(false)
  const ref = useClickOutside(open, () => setOpen(false))
  const cfg = ORDER_STATUS[order.status]
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-1.5 rounded-lg border border-espresso/15 bg-proof-cream px-2.5 py-1.5 text-xs font-medium text-espresso hover:bg-sourdough/30">
        <cfg.icon className={`h-3.5 w-3.5 ${cfg.color}`} /> {cfg.label}
        <ChevronDown className="h-3 w-3 text-espresso/40" />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-36 overflow-hidden rounded-bakery border border-espresso/10 bg-proof-cream shadow-bakery-lg">
          {Object.entries(ORDER_STATUS).map(([key, sc]) => (
            <button key={key} onClick={() => { onUpdate(key); setOpen(false) }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-espresso hover:bg-sourdough/30">
              <sc.icon className={`h-3.5 w-3.5 ${sc.color}`} /> {sc.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

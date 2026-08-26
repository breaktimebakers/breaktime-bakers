import { CheckSquare, Square } from 'lucide-react'
import { Button } from '@/components/shared'
import { ORDER_STATUS } from '@/constants/orderStatus'
import { formatDate } from '@/utils'
import { StatusDropdown } from './StatusDropdown'

export function OrderTicket({ order, stores, areas, orderTakers, onFill, onStatus, selected, onToggleSelect }) {
  const store = stores.find((s) => s.id === order.storeId)
  const area = areas.find((a) => a.id === store?.areaId)
  const ot = orderTakers.find((o) => o.id === order.orderTakerId)
  const cfg = ORDER_STATUS[order.status]
  const items = order.items || []

  return (
    <div className={`ticket-edge ticket-edge-bottom relative overflow-hidden rounded-bakery border bg-proof-cream p-5 pt-6 shadow-bakery ${selected ? 'border-oven-amber/50 ring-1 ring-oven-amber/30' : 'border-espresso/10'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <button onClick={onToggleSelect} className="mt-0.5 shrink-0 text-espresso/40 hover:text-oven-amber">
            {selected ? <CheckSquare className="h-4 w-4 text-oven-amber" /> : <Square className="h-4 w-4" />}
          </button>
          <div className="min-w-0">
            <h3 className="truncate font-display text-base font-semibold text-espresso">{store?.dealerName || 'Unknown'}</h3>
            <p className="text-xs text-espresso/50">{area?.name}</p>
          </div>
        </div>
        <span className={`stamp ${cfg.stampClass}`}><cfg.icon className="h-3 w-3" />{cfg.label}</span>
      </div>

      <div className="mt-3 space-y-1">
        {items.length === 0 ? (
          <p className="text-xs text-espresso/40">No products</p>
        ) : (
          items.map((it) => (
            <div key={it.id} className="flex items-center justify-between text-xs">
              <span className="truncate text-espresso/80">{it.productName}</span>
              <span className="shrink-0 pl-2 font-mono text-espresso/70">{it.fulfilledQty || 0}/{it.quantity} {it.unit}</span>
            </div>
          ))
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div><p className="text-espresso/40">Date</p><p className="text-espresso/80">{formatDate(order.orderDate)}</p></div>
        <div><p className="text-espresso/40">Order taker</p><p className="text-espresso/80">{ot?.name}</p></div>
      </div>
      <div className="perforation mt-4 mb-3" />
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={onFill}>Fill order</Button>
        <StatusDropdown order={order} onUpdate={onStatus} />
      </div>
    </div>
  )
}

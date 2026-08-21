import { Link } from '@tanstack/react-router'
import { Truck, MapPin, Calendar } from 'lucide-react'
import { useSales } from '@/features/sales/hooks'
import { useDelivery } from '@/features/delivery/hooks'

const statusConfig = {
  planned: { label: 'Planned', color: 'text-espresso/50', stampClass: 'text-espresso/50' },
  in_progress: { label: 'In Progress', color: 'text-oven-amber', stampClass: 'text-oven-amber' },
  completed: { label: 'Completed', color: 'text-matcha-glaze', stampClass: 'text-matcha-glaze' },
}

export function TripCard({ trip, linkable = true }) {
  const { drivers } = useDelivery()
  const { areas, orders } = useSales()
  const driver = drivers.find((d) => d.id === trip.driverId)
  const area = areas.find((a) => a.id === trip.areaId)
  const cfg = statusConfig[trip.status]

  const totalStops = trip.stopSequence.length
  const deliveredStops = trip.stopSequence.filter((storeId) => {
    const stopOrders = trip.orderIds.map((oid) => orders.find((o) => o.id === oid)).filter((o) => o && o.storeId === storeId)
    return stopOrders.length > 0 && stopOrders.every((o) => o.status === 'delivered')
  }).length
  const progress = totalStops > 0 ? (deliveredStops / totalStops) * 100 : 0

  const content = (
    <div className="ticket-edge ticket-edge-bottom relative overflow-hidden rounded-bakery border border-espresso/10 bg-proof-cream p-5 pt-6 shadow-bakery transition-all hover:shadow-bakery-lg">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-display text-base font-semibold text-espresso">{driver?.name || 'Unassigned'}</h3>
          <p className="flex items-center gap-1 text-xs text-espresso/50"><MapPin className="h-3 w-3" />{area?.name}</p>
        </div>
        <span className={`stamp ${cfg.stampClass}`}>{cfg.label}</span>
      </div>
      <div className="mt-3 flex items-center gap-3 text-xs text-espresso/50">
        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(trip.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        <span className="flex items-center gap-1"><Truck className="h-3 w-3" />{totalStops} {totalStops === 1 ? 'stop' : 'stops'}</span>
      </div>
      <div className="mt-3">
        <div className="mb-1 flex justify-between text-xs">
          <span className="text-espresso/50">Progress</span>
          <span className="font-mono text-espresso/70">{deliveredStops}/{totalStops}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-espresso/8">
          <div className="h-full rounded-full bg-matcha-glaze transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  )

  if (linkable) {
    return <Link to="/delivery/trips/$tripId" params={{ tripId: trip.id }}>{content}</Link>
  }
  return content
}

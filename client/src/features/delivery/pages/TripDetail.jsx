import { useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { MapPin, Calendar, Truck, Check, CircleCheck } from 'lucide-react'
import { useDelivery } from '@/features/delivery/hooks'
import { useSales } from '@/features/sales/hooks'
import { Button, EmptyState, PageHeader } from '@/components/shared'

const statusConfig = {
  planned: { label: 'Planned', color: 'text-espresso/50', stampClass: 'text-espresso/50' },
  in_progress: { label: 'In Progress', color: 'text-oven-amber', stampClass: 'text-oven-amber' },
  completed: { label: 'Completed', color: 'text-matcha-glaze', stampClass: 'text-matcha-glaze' },
}

export default function TripDetail() {
  const { tripId } = useParams({ strict: false })
  const { trips, drivers, updateTripStatus, markStopDelivered } = useDelivery()
  const { areas, stores, orders } = useSales()
  const [flashStop, setFlashStop] = useState(null)

  const trip = trips.find((t) => t.id === tripId)
  if (!trip) return <EmptyState icon={Truck} title="Trip not found" description="This trip does not exist." />

  const driver = drivers.find((d) => d.id === trip.driverId)
  const area = areas.find((a) => a.id === trip.areaId)
  const cfg = statusConfig[trip.status]

  const stopOrders = (storeId) => trip.orderIds.map((oid) => orders.find((o) => o.id === oid)).filter((o) => o && o.storeId === storeId)
  const isStopDelivered = (storeId) => {
    const so = stopOrders(storeId)
    return so.length > 0 && so.every((o) => o.status === 'delivered')
  }

  const allDelivered = trip.stopSequence.every((sid) => isStopDelivered(sid))
  const deliveredCount = trip.stopSequence.filter((sid) => isStopDelivered(sid)).length
  const progress = trip.stopSequence.length > 0 ? (deliveredCount / trip.stopSequence.length) * 100 : 0

  const handleMarkStop = (storeId) => {
    markStopDelivered(trip.id, storeId)
    setFlashStop(storeId)
    setTimeout(() => setFlashStop(null), 1400)
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-espresso/50">
        <Link to="/delivery/trips" className="hover:text-oven-amber">Trips</Link><span>/</span>
        <span className="text-espresso">Trip #{trip.id}</span>
      </div>

      <PageHeader eyebrow="Delivery / Trip" title={`Trip #${trip.id.slice(-4)}`} description={
        <span className="flex flex-wrap items-center gap-3 text-sm text-espresso/55">
          <span className="flex items-center gap-1"><Truck className="h-3.5 w-3.5" />{driver?.name}</span>
          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{area?.name}</span>
          <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(trip.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        </span>
      } actions={
        <Button onClick={() => updateTripStatus(trip.id, 'completed')} disabled={!allDelivered || trip.status === 'completed'}>
          <CircleCheck className="h-4 w-4" /> Mark trip completed
        </Button>
      } />

      <div className="mb-5 flex items-center gap-3">
        <span className={`stamp ${cfg.stampClass}`}>{cfg.label}</span>
        <div className="flex-1">
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-espresso/50">Progress</span>
            <span className="font-mono text-espresso/70">{deliveredCount}/{trip.stopSequence.length} stops</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-espresso/8">
            <div className="h-full rounded-full bg-matcha-glaze transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <h2 className="mb-3 font-display text-xl font-semibold text-espresso">Stops</h2>
      <div className="space-y-3">
        {trip.stopSequence.map((storeId, i) => {
          const store = stores.find((s) => s.id === storeId)
          const so = stopOrders(storeId)
          const delivered = isStopDelivered(storeId)
          const flashClass = flashStop === storeId ? 'animate-flash' : ''
          return (
            <div key={storeId + i} className={`relative overflow-hidden rounded-bakery border border-espresso/8 bg-proof-cream p-4 shadow-bakery ${flashClass}`}>
              <div className="flex items-start gap-3">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-sm font-bold ${delivered ? 'bg-matcha-glaze text-crust' : 'bg-espresso text-crust'}`}>{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-base font-semibold text-espresso">{store?.dealerName}</h3>
                      <p className="text-xs text-espresso/50">{store?.address}</p>
                    </div>
                    {delivered && <span className="stamp text-matcha-glaze shrink-0"><Check className="h-3 w-3" />Delivered</span>}
                  </div>
                  <div className="mt-2 space-y-1">
                    {so.map((o) => (
                      <div key={o.id} className="flex items-center justify-between text-xs">
                        <span className="text-espresso/70">{o.product}</span>
                        <span className="font-mono text-espresso/80">{o.quantity} units</span>
                      </div>
                    ))}
                  </div>
                  {!delivered && (
                    <Button size="sm" variant="secondary" className="mt-3" onClick={() => handleMarkStop(storeId)}>
                      <Check className="h-3.5 w-3.5" /> Mark delivered
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

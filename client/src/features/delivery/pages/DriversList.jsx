import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { MapPin, Truck, CircleCheck } from 'lucide-react'
import { useDelivery } from '@/features/delivery/hooks'
import { useSales } from '@/features/sales/hooks'
import { Button, PageHeader } from '@/components/shared'
import { AssignDriverAreasModal } from '../components/AssignDriverAreasModal'

export default function DriversList() {
  const { drivers, trips } = useDelivery()
  const { areas, orders } = useSales()
  const [assignDriver, setAssignDriver] = useState(null)

  return (
    <div>
      <PageHeader eyebrow="Delivery / Drivers" title="Drivers" description="Delivery drivers and their assigned territories." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {drivers.map((d) => {
          const assignedAreas = areas.filter((a) => d.assignedAreaIds.includes(a.id))
          const driverTrips = trips.filter((t) => t.driverId === d.id)
          const weekTrips = driverTrips.filter((t) => { const dt = new Date(t.date); return (new Date() - dt) / 86400000 <= 7 })
          const completedStops = driverTrips.flatMap((t) => t.orderIds).map((oid) => orders.find((o) => o.id === oid)).filter((o) => o?.status === 'delivered').length
          return (
            <Link key={d.id} to="/delivery/drivers/$driverId" params={{ driverId: d.id }} className="group rounded-bakery border border-espresso/8 bg-proof-cream p-5 shadow-bakery transition-all hover:-translate-y-0.5 hover:shadow-bakery-lg">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-oven-amber/15 font-mono text-sm font-semibold text-oven-amber">
                  {d.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-lg font-semibold text-espresso">{d.name}</h3>
                  <p className="text-xs text-espresso/50">{d.phone}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {assignedAreas.map((a) => (
                  <span key={a.id} className="inline-flex items-center gap-1 rounded-full bg-espresso/5 px-2.5 py-1 text-xs text-espresso/70"><MapPin className="h-3 w-3" />{a.name}</span>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-3 text-xs text-espresso/50">
                <span className="flex items-center gap-1"><Truck className="h-3 w-3" />{weekTrips.length} trips this week</span>
                <span className="flex items-center gap-1"><CircleCheck className="h-3 w-3" />{completedStops} completed</span>
              </div>
              <div className="mt-4">
                <Button size="sm" variant="ghost" onClick={(e) => { e.preventDefault(); setAssignDriver(d) }}>Assign areas</Button>
              </div>
            </Link>
          )
        })}
      </div>

      <AssignDriverAreasModal open={!!assignDriver} onClose={() => setAssignDriver(null)} driver={assignDriver} />
    </div>
  )
}

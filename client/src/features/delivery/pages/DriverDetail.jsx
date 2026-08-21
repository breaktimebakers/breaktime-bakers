import { useState, useMemo } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'
import { MapPin, Truck, CircleCheck, CircleDot } from 'lucide-react'
import { useDelivery } from '@/features/delivery/hooks'
import { useSales } from '@/features/sales/hooks'
import { Button, EmptyState, PageHeader } from '@/components/shared'
import { TripCard } from '../components/TripCard'
import { AssignDriverAreasModal } from '../components/AssignDriverAreasModal'

function StatCard({ label, value, icon: Icon, chipColor }) {
  return (
    <div className="rounded-bakery border border-espresso/8 bg-proof-cream p-4 shadow-bakery sm:p-5">
      <div className="flex items-start justify-between">
        <div><p className="font-mono text-[10px] uppercase tracking-wider text-espresso/50">{label}</p><p className="mt-1.5 font-mono text-2xl font-bold text-espresso sm:text-3xl">{value}</p></div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-bakery ${chipColor}`}><Icon className="h-5 w-5" /></div>
      </div>
    </div>
  )
}

export default function DriverDetail() {
  const { driverId } = useParams({ strict: false })
  const { drivers, trips } = useDelivery()
  const { areas, orders } = useSales()
  const [range, setRange] = useState('7')
  const [assignOpen, setAssignOpen] = useState(false)

  const driver = drivers.find((d) => d.id === driverId)
  if (!driver) return <EmptyState icon={Truck} title="Driver not found" description="This driver does not exist." />

  const driverTrips = trips.filter((t) => t.driverId === driverId).sort((a, b) => new Date(b.date) - new Date(a.date))
  const assignedAreas = areas.filter((a) => driver.assignedAreaIds.includes(a.id))
  const allTripOrderIds = driverTrips.flatMap((t) => t.orderIds)
  const completed = allTripOrderIds.map((oid) => orders.find((o) => o.id === oid)).filter((o) => o?.status === 'delivered').length
  const pending = allTripOrderIds.map((oid) => orders.find((o) => o.id === oid)).filter((o) => o && o.status !== 'delivered').length

  const barData = useMemo(() => {
    const days = parseInt(range)
    const out = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const label = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
      const dayTrips = driverTrips.filter((t) => t.date === d.toISOString().slice(0, 10))
      const stops = dayTrips.flatMap((t) => t.orderIds).map((oid) => orders.find((o) => o.id === oid)).filter((o) => o?.status === 'delivered').length
      out.push({ day: label, stops })
    }
    return out
  }, [driverTrips, orders, range])

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-espresso/50">
        <Link to="/delivery/drivers" className="hover:text-oven-amber">Drivers</Link><span>/</span>
        <span className="text-espresso">{driver.name}</span>
      </div>

      <PageHeader eyebrow="Delivery / Driver" title={driver.name} description={`${driver.phone} · ${assignedAreas.length} assigned ${assignedAreas.length === 1 ? 'area' : 'areas'}`} actions={<Button variant="secondary" onClick={() => setAssignOpen(true)}>Assign areas</Button>} />

      <div className="mb-4 flex flex-wrap gap-1.5">
        {assignedAreas.map((a) => (
          <span key={a.id} className="inline-flex items-center gap-1 rounded-full bg-espresso/5 px-2.5 py-1 text-xs text-espresso/70"><MapPin className="h-3 w-3" />{a.name}</span>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard label="Total trips" value={driverTrips.length} icon={Truck} chipColor="bg-sourdough/50 text-espresso" />
        <StatCard label="Deliveries completed" value={completed} icon={CircleCheck} chipColor="bg-matcha-glaze/20 text-matcha-glaze" />
        <StatCard label="Deliveries pending" value={pending} icon={CircleDot} chipColor="bg-cherry-compote/15 text-cherry-compote" />
      </div>

      <div className="mt-6 rounded-bakery border border-espresso/8 bg-proof-cream p-5 shadow-bakery">
        <div className="flex items-center justify-between">
          <div><h3 className="font-display text-lg font-semibold text-espresso">Stops completed per day</h3><p className="text-xs text-espresso/50">Recent activity</p></div>
          <div className="inline-flex rounded-full bg-crust p-0.5">
            {[7, 30].map((r) => <button key={r} onClick={() => setRange(String(r))} className={`rounded-full px-3 py-1 text-xs font-medium transition ${range === String(r) ? 'bg-espresso text-crust' : 'text-espresso/60'}`}>{r}d</button>)}
          </div>
        </div>
        <div className="mt-4 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,42,33,0.08)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'rgba(59,42,33,0.5)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11, fill: 'rgba(59,42,33,0.5)' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid rgba(59,42,33,0.1)', fontSize: 12 }} cursor={{ fill: 'rgba(201,122,43,0.08)' }} />
              <Bar dataKey="stops" fill="#C97A2B" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <h2 className="mb-3 mt-8 font-display text-xl font-semibold text-espresso">Trips</h2>
      {driverTrips.length === 0 ? (
        <EmptyState icon={Truck} title="No trips yet" description="Create a trip for this driver." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {driverTrips.map((t) => <TripCard key={t.id} trip={t} />)}
        </div>
      )}

      <AssignDriverAreasModal open={assignOpen} onClose={() => setAssignOpen(false)} driver={driver} />
    </div>
  )
}

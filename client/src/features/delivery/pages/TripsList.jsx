import { useState, useMemo } from 'react'
import { Plus, Route } from 'lucide-react'
import { useDelivery } from '@/features/delivery/hooks'
import { useSales } from '@/features/sales/hooks'
import { Button, EmptyState, PageHeader, inputClass } from '@/components/shared'
import { TripCard } from '../components/TripCard'
import { CreateTripModal } from '../components/CreateTripModal'
import { todayISO, isWithinLastNDays } from '@/utils'

export default function TripsList() {
  const { trips, drivers } = useDelivery()
  const { areas } = useSales()
  const [filter, setFilter] = useState('week')
  const [driverFilter, setDriverFilter] = useState('all')
  const [areaFilter, setAreaFilter] = useState('all')
  const [createOpen, setCreateOpen] = useState(false)

  const filtered = useMemo(() => {
    return trips.filter((t) => {
      if (driverFilter !== 'all' && t.driverId !== driverFilter) return false
      if (areaFilter !== 'all' && t.areaId !== areaFilter) return false
      if (filter === 'today' && t.date !== todayISO()) return false
      if (filter === 'week' && !isWithinLastNDays(t.date, 7)) return false
      return true
    }).sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [trips, filter, driverFilter, areaFilter])

  return (
    <div>
      <PageHeader eyebrow="Delivery / Trips" title="Trips" description="Plan and track delivery trips stop by stop." actions={<Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Create trip</Button>} />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {['today', 'week', 'custom'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3.5 py-1.5 text-xs font-medium capitalize transition ${filter === f ? 'bg-espresso text-crust' : 'bg-proof-cream text-espresso/60 hover:bg-sourdough/40'}`}>
            {f === 'today' ? 'Today' : f === 'week' ? 'This Week' : 'Custom Range'}
          </button>
        ))}
        <select className={`${inputClass} max-w-[140px]`} value={driverFilter} onChange={(e) => setDriverFilter(e.target.value)}>
          <option value="all">All drivers</option>
          {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select className={`${inputClass} max-w-[140px]`} value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)}>
          <option value="all">All areas</option>
          {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Route} title="No trips found" description="Create a trip to get started." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((t) => <TripCard key={t.id} trip={t} />)}
        </div>
      )}

      <CreateTripModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}

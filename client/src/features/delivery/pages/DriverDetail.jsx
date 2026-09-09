import { useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'
import { MapPin, Truck, CircleCheck, CircleDot, ArrowLeft } from 'lucide-react'
import { useDriverDay, useDriverStats, useDeliveryScheduleDay } from '@/features/delivery/hooks'
import { useWorker } from '@/features/workers/hooks'
import { Button, EmptyState, ErrorState, PageHeader, StatCard, inputClass } from '@/components/shared'
import { AssignDriverAreasModal } from '../components/AssignDriverAreasModal'
import { DriverStoresTable } from '../components/DriverStoresTable'

export default function DriverDetail() {
  const { driverId } = useParams({ strict: false })
  const [selectedDate, setSelectedDate] = useState('')
  const [range, setRange] = useState('7')
  const [assignOpen, setAssignOpen] = useState(false)
  const [activeAreaId, setActiveAreaId] = useState(null)

  const workerQuery = useWorker(driverId)
  const dayQuery = useDriverDay(driverId, selectedDate)
  const scheduleQuery = useDeliveryScheduleDay(selectedDate)
  const statsQuery = useDriverStats(driverId, Number(range))

  const { data: driver, isLoading: driverLoading, isError: driverError, isFetching: driverFetching, refetch: refetchDriver } = workerQuery
  const { data: dayData, isLoading: dayLoading, isError: dayError, isFetching: dayFetching, refetch: refetchDay } = dayQuery
  const { data: schedule } = scheduleQuery
  const { data: stats } = statsQuery

  if (driverError) return <ErrorState description="Could not load this driver." onRetry={refetchDriver} retrying={driverFetching} />
  if (driverLoading) return <p role="status" className="py-8 text-center text-sm text-espresso/50">Loading driver…</p>
  if (!driver) return <EmptyState icon={Truck} title="Driver not found" description="This driver does not exist." />

  const date = dayData?.date
  const areas = dayData?.areas || []
  const allStores = areas.flatMap((area) => area.stores)
  const completed = allStores.filter((store) => store.status === 'delivered').length
  const pending = allStores.filter((store) => store.status === 'pending' || store.status === 'partial').length

  const barData = (stats?.daily || []).map((entry) => ({
    day: new Date(`${entry.date}T00:00:00Z`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', timeZone: 'Asia/Kolkata' }),
    stops: entry.delivered,
  }))

  const otherAssignments = (schedule?.assignments || [])
    .filter((a) => a.driverId !== driverId)
    .flatMap((a) => a.areas.map((area) => ({ areaId: area.id, driverName: a.driverName })))

  const selectedAreaId = areas.some((area) => area.areaId === activeAreaId) ? activeAreaId : areas[0]?.areaId
  const selectedArea = areas.find((area) => area.areaId === selectedAreaId)

  return (
    <div>
      <Link to="/delivery/drivers" className="mb-3 inline-flex items-center gap-1.5 text-sm text-espresso/50 hover:text-oven-amber">
        <ArrowLeft className="h-4 w-4" /> Back to drivers
      </Link>
      <PageHeader eyebrow="Delivery / Driver" title={driver.name} description={driver.phone || '—'} actions={<Button variant="secondary" disabled={!date} onClick={() => setAssignOpen(true)}>Assign areas</Button>} />

      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-bakery border border-espresso/8 bg-proof-cream p-4 shadow-bakery">
        <label className="block text-sm font-medium text-espresso">
          Date
          <input type="date" className={`${inputClass} mt-1`} value={selectedDate || date || ''} disabled={dayFetching} onChange={(event) => setSelectedDate(event.target.value)} />
        </label>
        <Button variant="secondary" disabled={dayFetching} onClick={() => { setSelectedDate(''); if (!selectedDate) refetchDay() }}>Today</Button>
      </div>

      {dayError ? (
        <ErrorState description="Could not load this driver's day." onRetry={refetchDay} retrying={dayFetching} />
      ) : dayLoading ? (
        <p role="status" className="py-8 text-center text-sm text-espresso/50">Loading…</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            <StatCard label="Areas assigned" value={areas.length} icon={MapPin} chipColor="bg-sourdough/50 text-espresso" />
            <StatCard label="Stores delivered" value={completed} icon={CircleCheck} chipColor="bg-matcha-glaze/20 text-matcha-glaze" />
            <StatCard label="Stores pending" value={pending} icon={CircleDot} chipColor="bg-cherry-compote/15 text-cherry-compote" />
          </div>

          <div className="mt-6 rounded-bakery border border-espresso/8 bg-proof-cream p-5 shadow-bakery">
            <div className="flex items-center justify-between">
              <div><h3 className="font-display text-lg font-semibold text-espresso">Stores delivered per day</h3><p className="text-xs text-espresso/50">Recent activity</p></div>
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

          <h2 className="mb-3 mt-8 font-display text-xl font-semibold text-espresso">{date}</h2>
          {areas.length === 0 ? (
            <EmptyState icon={MapPin} title="No areas assigned" description="Assign this driver an area for this date to see their stores here." />
          ) : areas.length === 1 ? (
            <div>
              <h3 className="mb-2 flex items-center gap-1.5 font-display text-base font-semibold text-espresso"><MapPin className="h-4 w-4 text-oven-amber" />{areas[0].areaName}</h3>
              <DriverStoresTable stores={areas[0].stores} />
            </div>
          ) : (
            <div>
              <div className="mb-4 inline-flex flex-wrap gap-1 rounded-full bg-crust p-0.5">
                {areas.map((area) => (
                  <button
                    key={area.areaId}
                    onClick={() => setActiveAreaId(area.areaId)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition ${
                      selectedAreaId === area.areaId ? 'bg-espresso text-crust' : 'text-espresso/60'
                    }`}
                  >
                    <MapPin className="h-3.5 w-3.5" /> {area.areaName}
                  </button>
                ))}
              </div>
              {selectedArea && <DriverStoresTable stores={selectedArea.stores} />}
            </div>
          )}
        </>
      )}

      {assignOpen && date && (
        <AssignDriverAreasModal
          key={`${driverId}-${date}`}
          open
          onClose={() => setAssignOpen(false)}
          driver={driver}
          date={date}
          assignedAreaIds={areas.map((area) => area.areaId)}
          otherAssignments={otherAssignments}
        />
      )}
    </div>
  )
}

import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { MapPin, UserRound } from 'lucide-react'
import { useDeliveryScheduleDay } from '@/features/delivery/hooks'
import { useWorkers } from '@/features/workers/hooks'
import { Button, EmptyState, ErrorState, PageHeader, inputClass } from '@/components/shared'
import { AssignDriverAreasModal } from '../components/AssignDriverAreasModal'

export default function DriversList() {
  // An empty date asks the server for its today, matching order-taker scheduling.
  const [selectedDate, setSelectedDate] = useState('')
  const { data: schedule, isLoading, isError, isFetching, refetch } = useDeliveryScheduleDay(selectedDate)
  const { data: workers = [] } = useWorkers()
  const [assignDriver, setAssignDriver] = useState(null)

  const date = schedule?.date
  const assignments = schedule?.assignments || []
  const phoneByDriverId = Object.fromEntries(workers.map((w) => [w.id, w.phone]))

  const otherAssignments = (driverId) => assignments
    .filter((a) => a.driverId !== driverId)
    .flatMap((a) => a.areas.map((area) => ({ areaId: area.id, driverName: a.driverName })))

  return (
    <div>
      <PageHeader eyebrow="Delivery / Drivers" title="Drivers" description="Delivery drivers and the areas assigned to each of them for a date." />

      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-bakery border border-espresso/8 bg-proof-cream p-4 shadow-bakery">
        <label className="block text-sm font-medium text-espresso">
          Date
          <input type="date" className={`${inputClass} mt-1`} value={selectedDate || date || ''} disabled={isFetching} onChange={(event) => setSelectedDate(event.target.value)} />
        </label>
        <Button variant="secondary" disabled={isFetching} onClick={() => { setSelectedDate(''); if (!selectedDate) refetch() }}>Today</Button>
      </div>

      {isError ? (
        <ErrorState description="Could not load drivers." onRetry={refetch} retrying={isFetching} />
      ) : isLoading ? (
        <p role="status" className="py-8 text-center text-sm text-espresso/50">Loading drivers…</p>
      ) : assignments.length === 0 ? (
        <EmptyState icon={UserRound} title="No drivers yet" description="Give an active worker the delivery role to see them here." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {assignments.map((driver) => (
            <div key={driver.driverId} className="rounded-bakery border border-espresso/8 bg-proof-cream p-5 shadow-bakery transition-all hover:-translate-y-0.5 hover:shadow-bakery-lg">
              <Link to="/delivery/drivers/$driverId" params={{ driverId: driver.driverId }} className="group flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-oven-amber/15 font-mono text-sm font-semibold text-oven-amber">
                  {driver.driverName.split(' ').map((n) => n[0]).join('')}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-lg font-semibold text-espresso group-hover:text-oven-amber">{driver.driverName}</h3>
                  <p className="text-xs text-espresso/50">{phoneByDriverId[driver.driverId] || '—'}</p>
                </div>
              </Link>
              {!driver.canAssign && <p className="mt-2 text-xs text-cherry-compote">Inactive or no longer a delivery worker. Clear any assignment to free its areas.</p>}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {driver.areas.length === 0 ? (
                  <span className="text-xs text-espresso/40">No areas assigned</span>
                ) : driver.areas.map((area) => (
                  <span key={area.id} className="inline-flex items-center gap-1 rounded-full bg-espresso/5 px-2.5 py-1 text-xs text-espresso/70"><MapPin className="h-3 w-3" />{area.name}</span>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Link to="/delivery/drivers/$driverId" params={{ driverId: driver.driverId }}>
                  <Button size="sm" variant="secondary">View detail</Button>
                </Link>
                <Button size="sm" variant="ghost" disabled={!driver.canAssign} onClick={() => setAssignDriver(driver)}>Assign areas</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {assignDriver && date && (
        <AssignDriverAreasModal
          key={`${assignDriver.driverId}-${date}`}
          open
          onClose={() => setAssignDriver(null)}
          driver={{ id: assignDriver.driverId, name: assignDriver.driverName }}
          date={date}
          assignedAreaIds={assignDriver.areas.map((area) => area.id)}
          otherAssignments={otherAssignments(assignDriver.driverId)}
        />
      )}
    </div>
  )
}

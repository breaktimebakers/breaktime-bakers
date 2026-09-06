import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, CalendarDays } from 'lucide-react'
import { useAreas, useScheduleDay, useSetDailyAssignment } from '@/features/sales/hooks'
import { Button, EmptyState, PageHeader, inputClass } from '@/components/shared'

export default function OrderTakerSchedule() {
  // An empty date asks the server for its today, matching order creation.
  const [selectedDate, setSelectedDate] = useState('')
  const { data: schedule, isLoading, isError, isFetching, refetch } = useScheduleDay(selectedDate)
  const { data: areas = [], isLoading: areasLoading, isError: areasError, refetch: refetchAreas } = useAreas()
  const saveAssignment = useSetDailyAssignment()
  const date = schedule?.date
  const assignments = schedule?.assignments || []
  const busy = saveAssignment.isPending

  const assign = async (workerId, areaId) => {
    if (!date) return
    try {
      await saveAssignment.mutateAsync({ workerId, date, areaId: areaId || null })
    } catch {
      // The mutation displays the server's error and refreshes conflicting assignments.
    }
  }

  return (
    <div>
      <Link to="/sales/orders/order-takers" className="mb-3 inline-flex items-center gap-1.5 text-sm text-espresso/50 hover:text-oven-amber">
        <ArrowLeft className="h-4 w-4" /> Back to order takers
      </Link>
      <PageHeader eyebrow="Sales / Order takers" title="Daily Area Assignments" description="Choose a date and assign an area to each order taker. Assignments apply only to that date and save automatically." />

      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-bakery border border-espresso/8 bg-proof-cream p-4 shadow-bakery">
        <label className="block text-sm font-medium text-espresso">
          Assignment date
          <input type="date" className={`${inputClass} mt-1`} value={selectedDate || date || ''} disabled={busy} onChange={(event) => setSelectedDate(event.target.value)} />
        </label>
        <Button variant="secondary" disabled={busy} onClick={() => { setSelectedDate(''); if (!selectedDate) refetch() }}>Today</Button>
        <p className="text-xs text-espresso/55">No area means unassigned for this date. Nothing repeats automatically.</p>
      </div>

      {isError || areasError ? (
        <div role="alert" className="rounded-bakery border border-cherry-compote/30 bg-proof-cream p-4">
          <p className="mb-3 text-sm text-cherry-compote">Could not load daily assignments or areas.</p>
          <Button variant="secondary" onClick={() => { refetch(); refetchAreas() }}>Retry</Button>
        </div>
      ) : isLoading || areasLoading ? (
        <p role="status" className="py-8 text-center text-sm text-espresso/50">Loading daily assignments…</p>
      ) : !assignments.length ? (
        <EmptyState icon={CalendarDays} title="No order takers yet" description="Give an active worker the marketer role to assign an area." />
      ) : (
        <div aria-busy={isFetching || busy} className="overflow-hidden rounded-bakery border border-espresso/8 bg-proof-cream shadow-bakery">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-espresso/10 bg-crust/30 text-left">
                  <th scope="col" className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Order taker</th>
                  <th scope="col" className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Assigned area</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((worker) => (
                  <tr key={worker.workerId} className="border-b border-espresso/8 last:border-0">
                    <td className="px-4 py-3 font-medium text-espresso">
                      {worker.workerName}
                      {!worker.canAssign && <p className="mt-1 text-xs font-normal text-espresso/50">Inactive or no longer a marketer. Clear this assignment to free the area.</p>}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        aria-label={`Area for ${worker.workerName}`}
                        className={inputClass}
                        value={worker.areaId || ''}
                        disabled={busy || isFetching}
                        onChange={(event) => assign(worker.workerId, event.target.value)}
                      >
                        <option value="">No area</option>
                        {worker.areaId && !areas.some((area) => area.id === worker.areaId) && <option value={worker.areaId} disabled>Area unavailable — clear assignment</option>}
                        {areas.map((area) => {
                          const owner = assignments.find((other) => other.workerId !== worker.workerId && other.areaId === area.id)
                          return <option key={area.id} value={area.id} disabled={!worker.canAssign || Boolean(owner)}>{area.name}{owner ? ` — ${owner.workerName}` : ''}</option>
                        })}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

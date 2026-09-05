import { useState, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, CalendarDays } from 'lucide-react'
import { useAreas, useScheduleWeek, useSaveWeeklyTemplate, useSetScheduleOverride } from '@/features/sales/hooks'
import { Button, EmptyState, Modal, PageHeader, inputClass } from '@/components/shared'

const WEEK_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function TemplateModal({ open, onClose, worker }) {
  const { data: areas = [] } = useAreas()
  const saveTemplate = useSaveWeeklyTemplate()
  const [days, setDays] = useState({})

  // Re-sync whenever a different worker is opened - the modal instance
  // doesn't unmount between "Edit route" clicks for different people.
  useEffect(() => {
    setDays(worker?.template || {})
  }, [worker])

  if (!worker) return null

  const submit = async () => {
    try {
      await saveTemplate.mutateAsync({ workerId: worker.workerId, days })
      onClose()
    } catch {
      // Error already surfaced as a toast by useSaveWeeklyTemplate.
    }
  }

  const busy = saveTemplate.isPending

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow="Order takers"
      title={`Weekly route — ${worker.workerName}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>{busy ? 'Saving…' : 'Save'}</Button>
        </>
      }
    >
      <p className="mb-3 text-xs text-espresso/50">
        Their default area for each day of the week - leave a day set to &quot;No area&quot; if they&apos;re off that day.
        This is the recurring route; use the schedule table to change a single day without touching it.
      </p>
      <div className="space-y-2">
        {WEEK_DAYS.map((day) => (
          <div key={day} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-sm font-medium text-espresso">{day}</span>
            <select
              className={inputClass}
              value={days[day] || ''}
              onChange={(e) => setDays((d) => ({ ...d, [day]: e.target.value || null }))}
            >
              <option value="">No area</option>
              {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        ))}
      </div>
    </Modal>
  )
}

function DayCell({ worker, day, areas }) {
  const setOverride = useSetScheduleOverride()

  const onChange = async (e) => {
    const areaId = e.target.value || null
    try {
      await setOverride.mutateAsync({ workerId: worker.workerId, date: day.date, areaId })
    } catch {
      // Error already surfaced as a toast by useSetScheduleOverride.
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <select
        className={`${inputClass} text-xs`}
        value={day.areaId || ''}
        onChange={onChange}
        disabled={setOverride.isPending}
      >
        <option value="">{day.isOverride ? 'Revert to default' : 'No area'}</option>
        {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
      </select>
      {day.isOverride && <span className="text-[10px] font-medium text-oven-amber">Override</span>}
    </div>
  )
}

export default function OrderTakerSchedule() {
  const { data: schedule, isLoading } = useScheduleWeek()
  const { data: areas = [] } = useAreas()
  const [editWorker, setEditWorker] = useState(null)

  return (
    <div>
      <Link to="/sales/orders/order-takers" className="mb-3 inline-flex items-center gap-1.5 text-sm text-espresso/50 hover:text-oven-amber">
        <ArrowLeft className="h-4 w-4" /> Back to order takers
      </Link>
      <PageHeader
        eyebrow="Sales / Order takers"
        title="Weekly Schedule"
        description="Which area each order taker covers this week, day by day. Change one day here without touching their default route, or edit the whole route at once."
      />

      {isLoading ? (
        <p className="px-1 py-8 text-center text-sm text-espresso/40">Loading schedule...</p>
      ) : !schedule?.workers?.length ? (
        <EmptyState icon={CalendarDays} title="No order takers yet" description="Give a worker the marketer role to schedule them here." />
      ) : (
        <div className="overflow-hidden rounded-bakery border border-espresso/8 bg-proof-cream shadow-bakery">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-espresso/10 bg-crust/30 text-left">
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Order taker</th>
                  {schedule.dates.map((date) => (
                    <th key={date} className="px-3 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">
                      {new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}
                    </th>
                  ))}
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {schedule.workers.map((w) => (
                  <tr key={w.workerId} className="border-b border-espresso/8 last:border-0">
                    <td className="px-4 py-3 font-medium text-espresso">{w.workerName}</td>
                    {w.days.map((day) => (
                      <td key={day.date} className="px-3 py-3">
                        <DayCell worker={w} day={day} areas={areas} />
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="ghost" onClick={() => setEditWorker(w)}>Edit route</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <TemplateModal open={!!editWorker} onClose={() => setEditWorker(null)} worker={editWorker} />
    </div>
  )
}

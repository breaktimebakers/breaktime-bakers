import { useState } from 'react'
import { Check, MapPin } from 'lucide-react'
import { useAreas } from '@/features/sales/hooks'
import { useSetDriverAreas } from '@/features/delivery/hooks'
import { Button, ErrorState, Modal } from '@/components/shared'

// otherAssignments: [{ areaId, driverName }] - areas already given to a
// different driver on this exact date, so they can't be picked here too;
// clear it from that driver first. Mirrors the disabled-option treatment
// on the order-taker's daily assignment table.
//
// The caller must remount this with a fresh `key` (e.g. `${driver.id}-${date}`)
// whenever the driver or date changes - `selected`'s initial state is only
// ever read once per mount, same as any other "seed local state from a
// prop" modal in this app.
export function AssignDriverAreasModal({ open, onClose, driver, date, assignedAreaIds = [], otherAssignments = [] }) {
  const { data: areas = [], isLoading, isError, isFetching, refetch } = useAreas()
  const setDriverAreas = useSetDriverAreas()
  const [selected, setSelected] = useState(assignedAreaIds)

  if (!driver) return null

  const busy = setDriverAreas.isPending
  const toggle = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]))

  const submit = async () => {
    try {
      await setDriverAreas.mutateAsync({ driverId: driver.id, date, areaIds: selected })
      onClose()
    } catch {
      // The mutation already toasts the error and refreshes conflicting assignments.
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow="Delivery / Drivers"
      title={`Assign areas — ${driver.name}`}
      footer={<><Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button><Button onClick={submit} disabled={busy || isLoading}>{busy ? 'Saving…' : 'Save'}</Button></>}
    >
      <p className="mb-3 text-xs text-espresso/55">For {date} only. Nothing repeats automatically to another date.</p>
      {isError ? (
        <ErrorState description="Could not load areas." onRetry={refetch} retrying={isFetching} />
      ) : isLoading ? (
        <p role="status" className="py-8 text-center text-sm text-espresso/50">Loading areas…</p>
      ) : (
        <div className="max-h-80 space-y-2 overflow-y-auto">
          {areas.map((area) => {
            const takenBy = otherAssignments.find((entry) => entry.areaId === area.id)
            const disabled = Boolean(takenBy) || busy
            return (
              <button
                key={area.id}
                type="button"
                disabled={disabled}
                onClick={() => toggle(area.id)}
                className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition ${selected.includes(area.id) ? 'border-oven-amber/40 bg-oven-amber/8' : 'border-espresso/10 bg-crust/30 hover:bg-crust/50'} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <div className="flex items-center gap-2.5">
                  <MapPin className="h-4 w-4 text-espresso/50" />
                  <span className="text-sm font-medium text-espresso">{area.name}</span>
                  <span className="text-xs text-espresso/40">{takenBy ? `— ${takenBy.driverName}` : area.city}</span>
                </div>
                {selected.includes(area.id) && <Check className="h-4 w-4 text-oven-amber" />}
              </button>
            )
          })}
        </div>
      )}
    </Modal>
  )
}

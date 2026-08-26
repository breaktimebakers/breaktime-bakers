import { useState, useEffect } from 'react'
import { Check, MapPin } from 'lucide-react'
import { useAreas } from '../hooks'
import { useUpdateWorkerAreas } from '@/features/workers/hooks'
import { Button, Modal } from '@/components/shared'

export function AssignAreasModal({ open, onClose, person }) {
  const { data: areas = [] } = useAreas()
  const updateWorkerAreas = useUpdateWorkerAreas()
  const [selected, setSelected] = useState([])

  // Re-sync whenever a different person is passed in - the modal instance
  // doesn't unmount between "Assign areas" clicks for different people.
  useEffect(() => {
    setSelected(person?.assignedAreaIds || [])
  }, [person])

  const toggle = (id) => setSelected((p) => p.includes(id) ? p.filter((a) => a !== id) : [...p, id])

  const submit = async () => {
    if (!person) return
    try {
      await updateWorkerAreas.mutateAsync({ id: person.id, areaIds: selected })
      onClose()
    } catch {
      // Error already surfaced as a toast by useUpdateWorkerAreas.
    }
  }

  if (!person) return null

  const busy = updateWorkerAreas.isPending

  return (
    <Modal open={open} onClose={onClose} eyebrow="Order takers" title={`Assign areas — ${person.name}`} footer={<><Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button><Button onClick={submit} disabled={busy}>{busy ? 'Saving…' : 'Save'}</Button></>}>
      <div className="space-y-2">
        {areas.map((a) => (
          <button key={a.id} onClick={() => toggle(a.id)} className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition ${selected.includes(a.id) ? 'border-oven-amber/40 bg-oven-amber/8' : 'border-espresso/10 bg-crust/30 hover:bg-crust/50'}`}>
            <div className="flex items-center gap-2.5">
              <MapPin className="h-4 w-4 text-espresso/50" />
              <span className="text-sm font-medium text-espresso">{a.name}</span>
              <span className="text-xs text-espresso/40">{a.city}</span>
            </div>
            {selected.includes(a.id) && <Check className="h-4 w-4 text-oven-amber" />}
          </button>
        ))}
      </div>
    </Modal>
  )
}

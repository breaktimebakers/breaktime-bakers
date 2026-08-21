import { useState } from 'react'
import { Check, MapPin } from 'lucide-react'
import { useSales } from '@/features/sales/hooks'
import { useDelivery } from '@/features/delivery/hooks'
import { Button, Modal } from '@/components/shared'

export function AssignDriverAreasModal({ open, onClose, driver }) {
  const { areas } = useSales()
  const { assignAreas } = useDelivery()
  const [selected, setSelected] = useState(driver?.assignedAreaIds || [])
  const toggle = (id) => setSelected((p) => p.includes(id) ? p.filter((a) => a !== id) : [...p, id])
  const submit = () => { if (driver) assignAreas(driver.id, selected); onClose() }
  if (!driver) return null
  return (
    <Modal open={open} onClose={onClose} eyebrow="Delivery / Drivers" title={`Assign areas — ${driver.name}`} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit}>Save</Button></>}>
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

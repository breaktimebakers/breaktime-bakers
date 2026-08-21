import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Plus, MapPin, ArrowRight, Store } from 'lucide-react'
import { useSales } from '@/features/sales/hooks'
import { Button, Field, Modal, PageHeader, inputClass } from '@/components/shared'

function AddAreaModal({ open, onClose }) {
  const { addArea } = useSales()
  const [form, setForm] = useState({ name: '', city: 'Mumbai', pincode: '' })
  const submit = () => {
    if (!form.name) return
    addArea(form)
    setForm({ name: '', city: 'Mumbai', pincode: '' })
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} eyebrow="Sales / Areas" title="Add area" footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit}>Add area</Button></>}>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Field label="Area name" required><input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Bandra" /></Field></div>
        <Field label="City" required><input className={inputClass} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
        <Field label="Pincode" required><input className={inputClass} value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} /></Field>
      </div>
    </Modal>
  )
}

export default function AreasList() {
  const { areas, stores } = useSales()
  const [addOpen, setAddOpen] = useState(false)

  return (
    <div>
      <PageHeader eyebrow="Sales / Areas" title="Areas" description="Sales territories and the stores within them." actions={<Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" /> Add area</Button>} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {areas.map((a) => {
          const count = stores.filter((s) => s.areaId === a.id).length
          return (
            <Link key={a.id} to="/sales/areas/$areaId" params={{ areaId: a.id }} className="group rounded-bakery border border-espresso/8 bg-proof-cream p-5 shadow-bakery transition-all hover:-translate-y-0.5 hover:shadow-bakery-lg">
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-bakery bg-oven-amber/15 text-oven-amber">
                  <MapPin className="h-5 w-5" />
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-espresso/5 px-2.5 py-1 text-xs font-medium text-espresso/70">
                  <Store className="h-3 w-3" /> {count} {count === 1 ? 'store' : 'stores'}
                </span>
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-espresso">{a.name}</h3>
              <p className="text-sm text-espresso/50">{a.city} · {a.pincode}</p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-oven-amber">
                View stores
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          )
        })}
      </div>

      <AddAreaModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}

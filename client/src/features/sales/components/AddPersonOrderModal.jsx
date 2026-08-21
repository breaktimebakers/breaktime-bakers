import { useState } from 'react'
import { useSales } from '../hooks'
import { Button, Field, Modal, inputClass } from '@/components/shared'
import { products } from '../data/seedSales'

export function AddPersonOrderModal({ open, onClose, person }) {
  const { stores, areas, addOrder } = useSales()
  const [form, setForm] = useState({ storeId: '', product: 'Butter Croissants', quantity: '' })
  const assignedStores = stores.filter((s) => person?.assignedAreaIds.includes(s.areaId))
  const submit = () => {
    if (!form.storeId || !person) return
    addOrder({ storeId: form.storeId, orderTakerId: person.id, product: form.product, quantity: form.quantity })
    setForm({ storeId: '', product: 'Butter Croissants', quantity: '' })
    onClose()
  }
  if (!person) return null
  return (
    <Modal open={open} onClose={onClose} eyebrow="Order takers" title={`Add order for ${person.name}`} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit}>Add order</Button></>}>
      <div className="grid gap-3">
        <Field label="Store (assigned areas only)" required>
          <select className={inputClass} value={form.storeId} onChange={(e) => setForm({ ...form, storeId: e.target.value })}>
            <option value="">Select store...</option>
            {person.assignedAreaIds.map((aid) => {
              const area = areas.find((a) => a.id === aid)
              return (
                <optgroup key={aid} label={area?.name}>
                  {assignedStores.filter((s) => s.areaId === aid).map((s) => <option key={s.id} value={s.id}>{s.dealerName}</option>)}
                </optgroup>
              )
            })}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Product" required>
            <select className={inputClass} value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })}>
              {products.map((p) => <option key={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Quantity" required><input type="number" className={inputClass} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></Field>
        </div>
      </div>
    </Modal>
  )
}

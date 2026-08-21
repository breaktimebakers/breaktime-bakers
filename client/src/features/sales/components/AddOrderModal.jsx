import { useState } from 'react'
import { useSales } from '../hooks'
import { Button, Field, Modal, inputClass } from '@/components/shared'
import { products } from '../data/seedSales'

export function AddOrderModal({ open, onClose, areaId }) {
  const { stores, areas, orderTakers, addOrder } = useSales()
  const [form, setForm] = useState({ storeId: '', orderTakerId: '', product: 'Butter Croissants', quantity: '' })
  const submit = () => {
    if (!form.storeId || !form.orderTakerId) return
    addOrder(form)
    setForm({ storeId: '', orderTakerId: '', product: 'Butter Croissants', quantity: '' })
    onClose()
  }
  const visibleAreas = areaId ? areas.filter((a) => a.id === areaId) : areas
  return (
    <Modal open={open} onClose={onClose} eyebrow="Sales / Orders" title="Add order" footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit}>Add order</Button></>}>
      <div className="grid gap-3">
        <Field label="Store" required>
          <select className={inputClass} value={form.storeId} onChange={(e) => setForm({ ...form, storeId: e.target.value })}>
            <option value="">Select store...</option>
            {visibleAreas.map((a) => (
              <optgroup key={a.id} label={a.name}>
                {stores.filter((s) => s.areaId === a.id).map((s) => <option key={s.id} value={s.id}>{s.dealerName}</option>)}
              </optgroup>
            ))}
          </select>
        </Field>
        <Field label="Order taker" required>
          <select className={inputClass} value={form.orderTakerId} onChange={(e) => setForm({ ...form, orderTakerId: e.target.value })}>
            <option value="">Select person...</option>
            {orderTakers.map((ot) => <option key={ot.id} value={ot.id}>{ot.name}</option>)}
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

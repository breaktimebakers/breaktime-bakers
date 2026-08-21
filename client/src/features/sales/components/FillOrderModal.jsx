import { useState, useEffect } from 'react'
import { useSales } from '../hooks'
import { Button, Field, Modal, inputClass } from '@/components/shared'
import { todayISO } from '@/utils'

export function FillOrderModal({ open, onClose, order }) {
  const { stores, orderTakers, fulfillOrder } = useSales()
  const [form, setForm] = useState({ fulfilledQty: '', fulfillmentDate: todayISO(), status: 'delivered', notes: '' })
  useEffect(() => {
    if (order) setForm({ fulfilledQty: order.quantity, fulfillmentDate: todayISO(), status: 'delivered', notes: order.notes || '' })
  }, [order])
  if (!order) return null
  const store = stores.find((s) => s.id === order.storeId)
  const ot = orderTakers.find((o) => o.id === order.orderTakerId)
  const submit = () => { fulfillOrder(order.id, form); onClose() }
  return (
    <Modal open={open} onClose={onClose} eyebrow="Sales / Orders" title="Fill order" footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit}>Save fulfillment</Button></>}>
      <div className="mb-4 rounded-bakery border border-espresso/8 bg-crust/30 p-3 text-sm">
        <p className="font-medium text-espresso">{store?.dealerName}</p>
        <p className="text-espresso/60">{order.product} · {order.quantity} units</p>
        <p className="text-espresso/50">Order taker: {ot?.name}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Quantity fulfilled" required><input type="number" className={inputClass} value={form.fulfilledQty} onChange={(e) => setForm({ ...form, fulfilledQty: e.target.value })} /></Field>
        <Field label="Fulfillment date"><input type="date" className={inputClass} value={form.fulfillmentDate} onChange={(e) => setForm({ ...form, fulfillmentDate: e.target.value })} /></Field>
        <div className="col-span-2">
          <Field label="Status">
            <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="in_transit">In Transit</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option>
            </select>
          </Field>
        </div>
        <div className="col-span-2">
          <Field label="Notes"><textarea className={`${inputClass} min-h-[80px] resize-y`} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
        </div>
      </div>
    </Modal>
  )
}

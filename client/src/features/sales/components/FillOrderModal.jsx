import { useState, useEffect } from 'react'
import { useAllStores, useFulfillOrder } from '../hooks'
import { useWorkers } from '@/features/workers/hooks'
import { Button, Field, Modal, inputClass } from '@/components/shared'
import { todayISO } from '@/utils'

export function FillOrderModal({ open, onClose, order }) {
  const { data: stores = [] } = useAllStores()
  const { data: workers = [] } = useWorkers()
  const fulfillOrder = useFulfillOrder()
  const [form, setForm] = useState({ status: 'delivered', fulfillmentDate: todayISO(), notes: '', items: [] })

  useEffect(() => {
    if (order) {
      setForm({
        status: 'delivered',
        fulfillmentDate: todayISO(),
        notes: order.notes || '',
        items: (order.items || []).map((it) => ({
          itemId: it.id,
          productName: it.productName,
          unit: it.unit,
          quantity: it.quantity,
          fulfilledQty: it.fulfilledQty || it.quantity,
        })),
      })
    }
  }, [order])

  if (!order) return null

  const store = stores.find((s) => s.id === order.storeId)
  const ot = workers.find((w) => w.id === order.orderTakerId)

  const updateItem = (i, val) => setForm((f) => ({ ...f, items: f.items.map((ln, idx) => idx === i ? { ...ln, fulfilledQty: val } : ln) }))

  const submit = async () => {
    try {
      await fulfillOrder.mutateAsync({
        id: order.id,
        body: {
          status: form.status,
          fulfillmentDate: form.fulfillmentDate,
          notes: form.notes || undefined,
          items: form.items.map((ln) => ({ itemId: ln.itemId, fulfilledQty: Number(ln.fulfilledQty) || 0 })),
        },
      })
      onClose()
    } catch {
      // Error already surfaced as a toast by useFulfillOrder.
    }
  }

  const busy = fulfillOrder.isPending

  return (
    <Modal open={open} onClose={onClose} eyebrow="Sales / Orders" title="Fill order" footer={<><Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button><Button onClick={submit} disabled={busy}>{busy ? 'Saving…' : 'Save fulfillment'}</Button></>}>
      <div className="mb-4 rounded-bakery border border-espresso/8 bg-crust/30 p-3 text-sm">
        <p className="font-medium text-espresso">{store?.dealerName}</p>
        <p className="text-espresso/50">Order taker: {ot?.name}</p>
      </div>

      <div className="mb-3">
        <span className="mb-1.5 block text-xs font-medium text-espresso/70">Quantity fulfilled per product</span>
        <div className="space-y-2">
          {form.items.map((ln, i) => (
            <div key={ln.itemId} className="flex items-center gap-2 rounded-lg border border-espresso/8 bg-crust/20 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-espresso">{ln.productName}</p>
                <p className="text-xs text-espresso/40">Ordered {ln.quantity} {ln.unit}</p>
              </div>
              <input type="number" className={`${inputClass} w-24`} value={ln.fulfilledQty} onChange={(e) => updateItem(i, e.target.value)} />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
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

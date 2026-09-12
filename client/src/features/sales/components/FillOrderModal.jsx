import { useState, useEffect } from 'react'
import { useAllStores, useFulfillOrder } from '../hooks'
import { useWorkers } from '@/features/workers/hooks'
import { Button, Field, Modal, inputClass } from '@/components/shared'
import { todayISO } from '@/utils'

export function FillOrderModal({ open, onClose, order }) {
  const { data: stores = [] } = useAllStores()
  const { data: workers = [] } = useWorkers()
  const fulfillOrder = useFulfillOrder()
  const drivers = workers.filter((w) => w.roles?.includes('delivery'))
  const [form, setForm] = useState({ status: 'delivered', fulfillmentDate: todayISO(), notes: '', items: [], amountCollected: '', collectedBy: '' })

  useEffect(() => {
    if (order) {
      // fulfillmentDate is only ever set by a successful fulfillment - its
      // absence means this order has never been fulfilled before, so it's
      // safe to default to "everything ordered, delivered today". Once a
      // fulfillment exists (even one that saved all zeros), reopening must
      // show exactly what was saved, not re-apply first-time defaults -
      // `|| it.quantity` used to treat a saved 0 as missing and silently
      // replace it with the full ordered quantity.
      const isFirstFulfillment = !order.fulfillmentDate
      setForm({
        status: isFirstFulfillment ? 'delivered' : order.status,
        fulfillmentDate: isFirstFulfillment ? todayISO() : order.fulfillmentDate,
        notes: order.notes || '',
        amountCollected: '',
        collectedBy: '',
        items: (order.items || []).map((it) => ({
          itemId: it.id,
          productName: it.productName,
          unit: it.unit,
          quantity: it.quantity,
          fulfilledQty: isFirstFulfillment ? it.quantity : it.fulfilledQty,
        })),
      })
    }
  }, [order])

  if (!order) return null

  const store = stores.find((s) => s.id === order.storeId)
  const ot = workers.find((w) => w.id === order.orderTakerId)

  const updateItem = (i, val) => setForm((f) => ({ ...f, items: f.items.map((ln, idx) => idx === i ? { ...ln, fulfilledQty: val } : ln) }))

  const quantityErrors = form.items.map((line) => {
    const quantity = Number(line.fulfilledQty)
    if (String(line.fulfilledQty).trim() === '' || !Number.isFinite(quantity)) return 'Enter a valid quantity.'
    if (quantity < 0) return 'Fulfilled quantity cannot be negative.'
    if (Math.abs(quantity * 1000 - Math.round(quantity * 1000)) >= 1e-6) return 'Use at most 3 decimal places.'
    return ''
  })
  const hasQuantityError = quantityErrors.some(Boolean)

  // Mirrors order.service.js: a fulfillment date is only required to mark
  // an order delivered, but if one is given (any status) it must be a real
  // date between the order date and today.
  const dateError = !form.fulfillmentDate
    ? (form.status === 'delivered' ? 'Fulfillment date is required when marking delivered.' : '')
    : form.fulfillmentDate < order.orderDate
      ? 'Fulfillment date cannot be before the order date.'
      : form.fulfillmentDate > todayISO()
        ? 'Fulfillment date cannot be in the future.'
        : ''

  const totalFulfilled = form.items.reduce((sum, ln) => sum + (Number(ln.fulfilledQty) || 0), 0)
  const statusError = form.status === 'delivered' && totalFulfilled === 0
    ? 'Cannot mark delivered with no fulfilled quantity.'
    : ''

  const amountCollectedError = form.amountCollected !== '' && (!Number.isFinite(Number(form.amountCollected)) || Number(form.amountCollected) <= 0)
    ? 'Enter an amount greater than 0, or leave it blank.'
    : ''

  const hasError = hasQuantityError || Boolean(dateError) || Boolean(statusError) || Boolean(amountCollectedError)

  const submit = async () => {
    if (hasError) return

    try {
      await fulfillOrder.mutateAsync({
        id: order.id,
        body: {
          status: form.status,
          fulfillmentDate: form.fulfillmentDate,
          notes: form.notes || undefined,
          items: form.items.map((ln) => ({ itemId: ln.itemId, fulfilledQty: Number(ln.fulfilledQty) })),
          amountCollected: form.amountCollected !== '' ? Number(form.amountCollected) : undefined,
          collectedBy: form.collectedBy || undefined,
        },
      })
      onClose()
    } catch {
      // Error already surfaced as a toast by useFulfillOrder.
    }
  }

  const busy = fulfillOrder.isPending

  return (
    <Modal open={open} onClose={onClose} eyebrow="Sales / Orders" title="Fill order" footer={<><Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button><Button onClick={submit} disabled={busy || hasError}>{busy ? 'Saving…' : 'Save fulfillment'}</Button></>}>
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
              <div className="w-36 shrink-0">
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  aria-label={`Fulfilled quantity for ${ln.productName}`}
                  aria-invalid={Boolean(quantityErrors[i])}
                  aria-describedby={quantityErrors[i] ? `fulfillment-quantity-error-${ln.itemId}` : undefined}
                  className={inputClass}
                  value={ln.fulfilledQty}
                  onChange={(e) => updateItem(i, e.target.value)}
                />
                {quantityErrors[i] && <p id={`fulfillment-quantity-error-${ln.itemId}`} role="alert" className="mt-1 text-xs text-cherry-compote">{quantityErrors[i]}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Fulfillment date">
          <input
            type="date"
            aria-invalid={Boolean(dateError)}
            aria-describedby={dateError ? 'fulfillment-date-error' : undefined}
            className={inputClass}
            value={form.fulfillmentDate}
            onChange={(e) => setForm({ ...form, fulfillmentDate: e.target.value })}
          />
          {dateError && <p id="fulfillment-date-error" role="alert" className="mt-1 text-xs text-cherry-compote">{dateError}</p>}
        </Field>
        <div className="col-span-2">
          <Field label="Status">
            <select
              aria-invalid={Boolean(statusError)}
              aria-describedby={statusError ? 'fulfillment-status-error' : undefined}
              className={inputClass}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="in_transit">In Transit</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option>
            </select>
            {statusError && <p id="fulfillment-status-error" role="alert" className="mt-1 text-xs text-cherry-compote">{statusError}</p>}
          </Field>
        </div>
        <div className="col-span-2">
          <Field label="Notes"><textarea className={`${inputClass} min-h-[80px] resize-y`} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
        </div>
        <Field label="Amount collected (₹)">
          <input
            type="number"
            min="0"
            step="0.01"
            aria-invalid={Boolean(amountCollectedError)}
            aria-describedby={amountCollectedError ? 'fulfillment-amount-collected-error' : undefined}
            className={inputClass}
            value={form.amountCollected}
            onChange={(e) => setForm({ ...form, amountCollected: e.target.value })}
            placeholder="Optional - leave blank if nothing collected"
          />
          {amountCollectedError && <p id="fulfillment-amount-collected-error" role="alert" className="mt-1 text-xs text-cherry-compote">{amountCollectedError}</p>}
        </Field>
        <Field label="Collected by">
          <select className={inputClass} value={form.collectedBy} onChange={(e) => setForm({ ...form, collectedBy: e.target.value })}>
            <option value="">Select driver...</option>
            {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </Field>
      </div>
    </Modal>
  )
}

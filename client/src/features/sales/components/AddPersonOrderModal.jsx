import { useState } from 'react'
import { X, AlertCircle } from 'lucide-react'
import { useAreas, useAllStores, useCreateOrder, useScheduleToday } from '../hooks'
import { useReadyStock } from '@/features/inventory/hooks'
import { Button, Field, Modal, inputClass } from '@/components/shared'

const makeEmptyForm = () => ({ storeId: '', notes: '', items: [] })

export function AddPersonOrderModal({ open, onClose, person }) {
  const createOrder = useCreateOrder()
  const { data: areas = [] } = useAreas()
  const { data: stores = [] } = useAllStores()
  const { data: todaySchedule } = useScheduleToday()
  // "all" - see AddOrderModal.jsx for why this can't use the hook's own
  // "today" default.
  const { data: products = [] } = useReadyStock({ filter: 'all' })
  const [form, setForm] = useState(makeEmptyForm)
  const [error, setError] = useState('')

  // Whichever single area this person is actually scheduled to today -
  // see order.service.js's matching server-side check, which rejects an
  // order for any other area.
  const todayAreaId = (todaySchedule?.assignments || []).find((a) => a.workerId === person?.id)?.areaId
  const todayStores = todayAreaId ? stores.filter((s) => s.areaId === todayAreaId) : []

  const addLine = () => setForm((f) => ({ ...f, items: [...f.items, { productId: products[0]?.id || '', quantity: '' }] }))
  const removeLine = (i) => setForm((f) => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))
  const updateLine = (i, field, val) => setForm((f) => ({ ...f, items: f.items.map((ln, idx) => idx === i ? { ...ln, [field]: val } : ln) }))

  const submit = async () => {
    if (!form.storeId || !person) return

    const items = form.items
      .filter((ln) => ln.productId && ln.quantity)
      .map((ln) => ({ productId: ln.productId, quantity: Number(ln.quantity) }))
    if (items.length === 0) return

    setError('')

    try {
      await createOrder.mutateAsync({
        storeId: form.storeId,
        orderTakerId: person.id,
        items,
        notes: form.notes || undefined,
      })
      setForm(makeEmptyForm())
      onClose()
    } catch (err) {
      setError(err.message || 'Could not add order.')
    }
  }

  if (!person) return null

  const busy = createOrder.isPending

  return (
    <Modal open={open} onClose={onClose} eyebrow="Order takers" title={`Add order for ${person.name}`} footer={<><Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button><Button onClick={submit} disabled={busy}>{busy ? 'Adding…' : 'Add order'}</Button></>}>
      <div className="grid gap-3">
        <Field label="Store (today's area only)" required>
          {todayAreaId ? (
            <select className={inputClass} value={form.storeId} onChange={(e) => setForm({ ...form, storeId: e.target.value })}>
              <option value="">Select store...</option>
              <optgroup label={areas.find((a) => a.id === todayAreaId)?.name}>
                {todayStores.map((s) => <option key={s.id} value={s.id}>{s.dealerName}</option>)}
              </optgroup>
            </select>
          ) : (
            <p className="text-xs text-cherry-compote">Not scheduled to any area today - set it in the daily assignments first.</p>
          )}
        </Field>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-espresso/70">Products</span>
            <button type="button" onClick={addLine} className="text-xs font-medium text-oven-amber hover:underline">+ Add product</button>
          </div>
          <div className="space-y-2">
            {form.items.map((ln, i) => (
              <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <select className={`${inputClass} w-full sm:flex-1`} value={ln.productId} onChange={(e) => updateLine(i, 'productId', e.target.value)}>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <div className="flex items-center gap-2">
                  <input type="number" className={`${inputClass} w-full sm:w-24`} placeholder="Qty" value={ln.quantity} onChange={(e) => updateLine(i, 'quantity', e.target.value)} />
                  <button type="button" onClick={() => removeLine(i)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-cherry-compote hover:bg-cherry-compote/10"><X className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
            {form.items.length === 0 && <p className="text-xs text-espresso/40">No products added yet.</p>}
          </div>
        </div>

        <Field label="Notes"><textarea className={`${inputClass} min-h-[70px] resize-y`} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional note" /></Field>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-cherry-compote/10 px-3 py-2 text-sm text-cherry-compote">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </Modal>
  )
}

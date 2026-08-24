import { useState } from 'react'
import { X } from 'lucide-react'
import { useCreateBatch, useRawMaterials } from '../hooks'
import { Button, Field, Modal, inputClass } from '@/components/shared'

const makeEmptyForm = () => ({
  productName: '', quantityProduced: '', unit: 'pcs', pricePerUnit: '', ingredientsUsed: [],
})

export function AddBatchModal({ open, onClose }) {
  const createBatch = useCreateBatch()
  const { data: rawMaterials = [] } = useRawMaterials()
  const [form, setForm] = useState(makeEmptyForm)

  const addLine = () => setForm((f) => ({ ...f, ingredientsUsed: [...f.ingredientsUsed, { rawMaterialId: rawMaterials[0]?.id || '', qty: '' }] }))
  const removeLine = (i) => setForm((f) => ({ ...f, ingredientsUsed: f.ingredientsUsed.filter((_, idx) => idx !== i) }))
  const updateLine = (i, field, val) => setForm((f) => ({ ...f, ingredientsUsed: f.ingredientsUsed.map((ln, idx) => idx === i ? { ...ln, [field]: val } : ln) }))

  const submit = async () => {
    if (!form.productName || !form.quantityProduced) return

    try {
      await createBatch.mutateAsync({
        productName: form.productName,
        quantityProduced: form.quantityProduced,
        unit: form.unit,
        pricePerUnit: form.pricePerUnit ? Number(form.pricePerUnit) : undefined,
        ingredients: form.ingredientsUsed
          .filter((ln) => ln.rawMaterialId && ln.qty)
          .map((ln) => ({ rawMaterialId: ln.rawMaterialId, qty: Number(ln.qty) })),
      })
      setForm(makeEmptyForm())
      onClose()
    } catch {
      // useCreateBatch's onError already surfaced this as a toast (e.g.
      // "Not enough stock of Flour - short by 4") - keep the modal open
      // so the admin can adjust a quantity and retry, instead of losing
      // the form.
    }
  }

  const busy = createBatch.isPending

  return (
    <Modal open={open} onClose={onClose} eyebrow="In process" title="Add production batch" footer={<><Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button><Button onClick={submit} disabled={busy}>{busy ? 'Adding…' : 'Add batch'}</Button></>}>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Field label="Product name" required><input className={inputClass} value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} placeholder="e.g. Butter Croissants" /></Field>
        </div>
        <Field label="Quantity produced" required><input type="number" className={inputClass} value={form.quantityProduced} onChange={(e) => setForm({ ...form, quantityProduced: e.target.value })} /></Field>
        <Field label="Unit" required>
          <select className={inputClass} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
            <option value="pcs">pcs</option><option value="loaves">loaves</option><option value="kg">kg</option><option value="trays">trays</option>
          </select>
        </Field>
        <div className="col-span-2">
          <Field label="Selling price per unit (₹)"><input type="number" className={inputClass} value={form.pricePerUnit} onChange={(e) => setForm({ ...form, pricePerUnit: e.target.value })} /></Field>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-espresso/70">Ingredients consumed</span>
          <button onClick={addLine} className="text-xs font-medium text-oven-amber hover:underline">+ Add ingredient</button>
        </div>
        <div className="space-y-2">
          {form.ingredientsUsed.map((ln, i) => (
            <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <select className={`${inputClass} w-full sm:flex-1`} value={ln.rawMaterialId} onChange={(e) => updateLine(i, 'rawMaterialId', e.target.value)}>
                {rawMaterials.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <div className="flex items-center gap-2">
                <input type="number" className={`${inputClass} w-full sm:w-20`} placeholder="Qty" value={ln.qty} onChange={(e) => updateLine(i, 'qty', e.target.value)} />
                <button onClick={() => removeLine(i)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-cherry-compote hover:bg-cherry-compote/10"><X className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
          {form.ingredientsUsed.length === 0 && <p className="text-xs text-espresso/40">No ingredients added yet.</p>}
        </div>
        <p className="mt-3 rounded-lg bg-oven-amber/8 px-3 py-2 text-xs text-espresso/60">
          Drawn from the oldest purchase lot first (FIFO). If a material doesn&apos;t have enough stock, the batch won&apos;t be saved.
        </p>
      </div>
    </Modal>
  )
}

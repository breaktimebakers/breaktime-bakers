import { useState, useEffect } from 'react'
import { X, AlertCircle } from 'lucide-react'
import { useUpdateBatch, useRawMaterials } from '../hooks'
import { Button, Field, Modal, inputClass } from '@/components/shared'

const formFromBatch = (batch) => ({
  productName: batch.productName,
  quantityProduced: String(batch.quantityProduced),
  unit: batch.unit,
  pricePerUnit: String(batch.pricePerUnit ?? ''),
  ingredientsUsed: batch.ingredientsUsed.map((ing) => ({ rawMaterialId: ing.rawMaterialId, qty: String(ing.qty) })),
})

// Full-replace edit, e.g. an ingredient was left off the original batch.
// Re-derives raw-material consumption and the Ready Stock movement from
// scratch server-side (see updateBatchWithConsumption) - not a patch of
// individual fields, so every field is resubmitted, same as AddBatchModal.
export function EditBatchModal({ open, onClose, batch }) {
  const updateBatch = useUpdateBatch()
  const { data: rawMaterials = [] } = useRawMaterials()
  const [form, setForm] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (batch) {
      setForm(formFromBatch(batch))
      setError('')
    }
  }, [batch])

  const addLine = () => setForm((f) => ({ ...f, ingredientsUsed: [...f.ingredientsUsed, { rawMaterialId: rawMaterials[0]?.id || '', qty: '' }] }))
  const removeLine = (i) => setForm((f) => ({ ...f, ingredientsUsed: f.ingredientsUsed.filter((_, idx) => idx !== i) }))
  const updateLine = (i, field, val) => setForm((f) => ({ ...f, ingredientsUsed: f.ingredientsUsed.map((ln, idx) => idx === i ? { ...ln, [field]: val } : ln) }))

  const submit = async () => {
    if (!batch || !form) return
    if (!form.productName || !form.quantityProduced || !form.pricePerUnit) return
    setError('')

    try {
      await updateBatch.mutateAsync({
        id: batch.id,
        body: {
          productName: form.productName,
          quantityProduced: form.quantityProduced,
          unit: form.unit,
          pricePerUnit: Number(form.pricePerUnit),
          ingredients: form.ingredientsUsed
            .filter((ln) => ln.rawMaterialId && ln.qty)
            .map((ln) => ({ rawMaterialId: ln.rawMaterialId, qty: Number(ln.qty) })),
        },
      })
      onClose()
    } catch (err) {
      // A 422 here means the reduced quantity would push Ready Stock
      // negative (some of it already sold/used) - keep the modal open so
      // the admin can see why and adjust, instead of losing the form.
      setError(err.message || 'Could not save changes.')
    }
  }

  const busy = updateBatch.isPending

  if (!form) return null

  return (
    <Modal open={open} onClose={onClose} eyebrow="In process" title="Edit production batch" footer={<><Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button><Button onClick={submit} disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</Button></>}>
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
          <Field label="Selling price per unit (₹)" required><input type="number" className={inputClass} value={form.pricePerUnit} onChange={(e) => setForm({ ...form, pricePerUnit: e.target.value })} /></Field>
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
          Re-drawn from the oldest purchase lot first (FIFO) using today&apos;s lot stock. If a material doesn&apos;t have enough stock, the change won&apos;t be saved.
        </p>
        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-cherry-compote/10 px-3 py-2 text-sm text-cherry-compote">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </Modal>
  )
}

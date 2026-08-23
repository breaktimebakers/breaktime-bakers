import { useState } from 'react'
import { X } from 'lucide-react'
import { useInventory, useRawMaterials } from '../hooks'
import { Button, Field, Modal, inputClass } from '@/components/shared'

export function AddBatchModal({ open, onClose }) {
  const { addBatch } = useInventory()
  const { data: rawMaterials = [] } = useRawMaterials()
  const [form, setForm] = useState({ productName: '', quantityProduced: '', unit: 'pcs', pricePerUnit: '', ingredientsUsed: [] })

  const addLine = () => setForm((f) => ({ ...f, ingredientsUsed: [...f.ingredientsUsed, { rawMaterialId: rawMaterials[0]?.id || '', qty: '' }] }))
  const removeLine = (i) => setForm((f) => ({ ...f, ingredientsUsed: f.ingredientsUsed.filter((_, idx) => idx !== i) }))
  const updateLine = (i, field, val) => setForm((f) => ({ ...f, ingredientsUsed: f.ingredientsUsed.map((ln, idx) => idx === i ? { ...ln, [field]: val } : ln) }))

  const submit = () => {
    if (!form.productName || !form.quantityProduced) return
    addBatch({ ...form, ingredientsUsed: form.ingredientsUsed.filter((ln) => ln.rawMaterialId && ln.qty) })
    setForm({ productName: '', quantityProduced: '', unit: 'pcs', pricePerUnit: '', ingredientsUsed: [] })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} eyebrow="In process" title="Add production batch" footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit}>Add batch</Button></>}>
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
          Recorded here for tracking only - production isn't wired to raw material stock yet, so this won't deduct from inventory.
        </p>
      </div>
    </Modal>
  )
}

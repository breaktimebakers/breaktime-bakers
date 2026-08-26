import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { useCreateRawMaterial } from '@/features/inventory/hooks'
import { uploadReceipt } from '@/lib/uploadReceipt'
import { Button, Field, Modal, ReceiptDropzone, inputClass } from '@/components/shared'
import { todayISO } from '@/utils'

const makeEmptyForm = () => ({
  name: '', unit: 'kg', openingQty: '', lowStockAt: '', openingRate: '', purchaseDate: todayISO(), vendor: '', receipt: null,
})

export function AddMaterialModal({ open, onClose }) {
  const createRawMaterial = useCreateRawMaterial()
  const [form, setForm] = useState(makeEmptyForm)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!form.name || !form.openingQty) return
    setError('')

    try {
      const receiptKey = form.receipt ? await uploadReceipt(form.receipt) : undefined

      await createRawMaterial.mutateAsync({
        name: form.name,
        unit: form.unit,
        lowStockAt: form.lowStockAt || 0,
        openingQty: form.openingQty,
        openingRate: form.openingRate || 0,
        vendor: form.vendor || undefined,
        purchaseDate: form.purchaseDate,
        receiptKey,
      })
      setForm(makeEmptyForm())
      onClose()
    } catch (err) {
      setError(err.message || 'Could not add raw material.')
    }
  }

  const busy = createRawMaterial.isPending

  return (
    <Modal open={open} onClose={onClose} eyebrow="Raw materials" title="Add raw material" footer={<><Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button><Button onClick={submit} disabled={busy}>{busy ? 'Adding…' : 'Add material'}</Button></>}>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Field label="Material name" required><input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Maida" /></Field>
        </div>
        <Field label="Unit" required>
          <select className={inputClass} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
            <option value="kg">kg</option><option value="litre">litre</option><option value="pouch">pouch</option>
          </select>
        </Field>
        <Field label="Opening quantity" required><input type="number" className={inputClass} value={form.openingQty} onChange={(e) => setForm({ ...form, openingQty: e.target.value })} /></Field>
        <Field label="Low-stock alert at" required><input type="number" className={inputClass} value={form.lowStockAt} onChange={(e) => setForm({ ...form, lowStockAt: e.target.value })} /></Field>
        <Field label="Opening rate (₹)" required><input type="number" className={inputClass} value={form.openingRate} onChange={(e) => setForm({ ...form, openingRate: e.target.value })} /></Field>
        <Field label="Purchase date"><input type="date" className={inputClass} value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} /></Field>
        <Field label="Vendor"><input className={inputClass} value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} /></Field>
        <div className="col-span-2">
          <Field label="Purchase receipt"><ReceiptDropzone value={form.receipt} onChange={(v) => setForm({ ...form, receipt: v })} /></Field>
        </div>
        {error && (
          <div className="col-span-2 flex items-center gap-2 rounded-lg bg-cherry-compote/10 px-3 py-2 text-sm text-cherry-compote">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </Modal>
  )
}

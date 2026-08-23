import { useState, useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import { useUpdateRawMaterial } from '@/features/inventory/hooks'
import { Button, Field, Modal, inputClass } from '@/components/shared'

export function EditMaterialModal({ open, onClose, material }) {
  const updateRawMaterial = useUpdateRawMaterial()
  const [form, setForm] = useState({ name: '', unit: 'kg', lowStockAt: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    if (material) setForm({ name: material.name, unit: material.unit, lowStockAt: material.lowStockAt })
  }, [material])

  const submit = async () => {
    if (!material) return
    setError('')

    try {
      await updateRawMaterial.mutateAsync({ id: material.id, body: form })
      onClose()
    } catch (err) {
      setError(err.message || 'Could not save changes.')
    }
  }

  const busy = updateRawMaterial.isPending

  return (
    <Modal open={open} onClose={onClose} eyebrow="Raw materials" title="Edit material" footer={<><Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button><Button onClick={submit} disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</Button></>}>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Field label="Material name" required><input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        </div>
        <Field label="Unit">
          <select className={inputClass} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
            <option value="kg">kg</option><option value="litre">litre</option><option value="pouch">pouch</option>
          </select>
        </Field>
        <Field label="Low-stock alert at" required><input type="number" className={inputClass} value={form.lowStockAt} onChange={(e) => setForm({ ...form, lowStockAt: e.target.value })} /></Field>
        {error && (
          <div className="col-span-2 flex items-center gap-2 rounded-lg bg-cherry-compote/10 px-3 py-2 text-sm text-cherry-compote">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
      <p className="mt-3 text-xs text-espresso/40">Purchase rates and lot history are managed from the row's purchase history.</p>
    </Modal>
  )
}

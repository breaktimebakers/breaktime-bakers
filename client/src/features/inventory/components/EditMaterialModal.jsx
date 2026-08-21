import { useState, useMemo } from 'react'
import { useInventory } from '../hooks'
import { Button, Field, Modal, inputClass } from '@/components/shared'

export function EditMaterialModal({ open, onClose, material }) {
  const { updateRawMaterial } = useInventory()
  const [form, setForm] = useState({ name: '', unit: 'kg', lowStockAt: '' })

  useMemo(() => {
    if (material) setForm({ name: material.name, unit: material.unit, lowStockAt: material.lowStockAt })
  }, [material])

  const submit = () => {
    if (!material) return
    updateRawMaterial(material.id, form)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} eyebrow="Raw materials" title="Edit material" footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit}>Save changes</Button></>}>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Field label="Material name" required><input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        </div>
        <Field label="Unit">
          <select className={inputClass} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
            <option value="kg">kg</option><option value="litre">litre</option>
          </select>
        </Field>
        <Field label="Low-stock alert at" required><input type="number" className={inputClass} value={form.lowStockAt} onChange={(e) => setForm({ ...form, lowStockAt: e.target.value })} /></Field>
      </div>
      <p className="mt-3 text-xs text-espresso/40">Purchase rates and lot history are managed from the row's purchase history.</p>
    </Modal>
  )
}

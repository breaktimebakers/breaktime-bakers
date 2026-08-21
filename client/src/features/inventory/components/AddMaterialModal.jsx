import { useState } from 'react'
import { useInventory } from '../hooks'
import { Button, Field, Modal, inputClass } from '@/components/shared'
import { ReceiptDropzone } from './ReceiptDropzone'
import { todayISO } from '@/utils'

export function AddMaterialModal({ open, onClose }) {
  const { addRawMaterial } = useInventory()
  const [form, setForm] = useState({ name: '', unit: 'kg', openingQty: '', lowStockAt: '', openingRate: '', purchaseDate: todayISO(), vendor: '', receiptName: '' })

  const submit = () => {
    if (!form.name) return
    addRawMaterial(form)
    setForm({ name: '', unit: 'kg', openingQty: '', lowStockAt: '', openingRate: '', purchaseDate: todayISO(), vendor: '', receiptName: '' })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} eyebrow="Raw materials" title="Add raw material" footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit}>Add material</Button></>}>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Field label="Material name" required><input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Maida" /></Field>
        </div>
        <Field label="Unit" required>
          <select className={inputClass} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
            <option value="kg">kg</option><option value="litre">litre</option>
          </select>
        </Field>
        <Field label="Opening quantity" required><input type="number" className={inputClass} value={form.openingQty} onChange={(e) => setForm({ ...form, openingQty: e.target.value })} /></Field>
        <Field label="Low-stock alert at" required><input type="number" className={inputClass} value={form.lowStockAt} onChange={(e) => setForm({ ...form, lowStockAt: e.target.value })} /></Field>
        <Field label="Opening rate (₹)" required><input type="number" className={inputClass} value={form.openingRate} onChange={(e) => setForm({ ...form, openingRate: e.target.value })} /></Field>
        <Field label="Purchase date"><input type="date" className={inputClass} value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} /></Field>
        <Field label="Vendor"><input className={inputClass} value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} /></Field>
        <div className="col-span-2">
          <Field label="Purchase receipt"><ReceiptDropzone value={form.receiptName} onChange={(v) => setForm({ ...form, receiptName: v })} /></Field>
        </div>
      </div>
    </Modal>
  )
}

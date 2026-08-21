import { useState } from 'react'
import { useInventory } from '../hooks'
import { Button, Field, Modal, inputClass } from '@/components/shared'
import { ReceiptDropzone } from './ReceiptDropzone'
import { todayISO } from '@/utils'

export function RestockModal({ open, onClose, material }) {
  const { restockRawMaterial } = useInventory()
  const [form, setForm] = useState({ qty: '', rate: '', vendor: '', purchaseDate: todayISO(), receiptName: '' })

  const submit = () => {
    if (!material || !form.qty) return
    restockRawMaterial(material.id, form)
    setForm({ qty: '', rate: '', vendor: '', purchaseDate: todayISO(), receiptName: '' })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} eyebrow="Restock" title={material ? `Restock ${material.name}` : ''} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit}>Add lot</Button></>}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Quantity" required><input type="number" className={inputClass} value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} /></Field>
        <Field label="Rate (₹)" required><input type="number" className={inputClass} value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} /></Field>
        <Field label="Vendor"><input className={inputClass} value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} /></Field>
        <Field label="Purchase date"><input type="date" className={inputClass} value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} /></Field>
        <div className="col-span-2">
          <Field label="Purchase receipt"><ReceiptDropzone value={form.receiptName} onChange={(v) => setForm({ ...form, receiptName: v })} /></Field>
        </div>
      </div>
    </Modal>
  )
}

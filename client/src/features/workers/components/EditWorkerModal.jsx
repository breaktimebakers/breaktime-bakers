import { useState } from 'react'
import { useWorkers } from '../hooks'
import { Button, Field, Modal, inputClass } from '@/components/shared'
import { AadhaarField } from './AadhaarField'
import { PhotoCapture } from './PhotoCapture'
import { roleConfig } from './RoleBadge'
import { dayNames } from '../utils'

const allRoles = ['chef', 'labour', 'delivery', 'marketer']

export function EditWorkerModal({ open, onClose, worker }) {
  const { updateWorker } = useWorkers()
  const [form, setForm] = useState(() => worker ? { ...worker } : {})

  const set = (field, val) => setForm((f) => ({ ...f, [field]: val }))
  const toggleRole = (r) => set('roles', form.roles.includes(r) ? form.roles.filter((x) => x !== r) : [...form.roles, r])

  const submit = () => {
    if (!form.name) return
    updateWorker(worker.id, {
      name: form.name, address: form.address, phone: form.phone, aadhaarNumber: form.aadhaarNumber,
      photo: form.photo, roles: form.roles, monthlySalary: Number(form.monthlySalary) || 0,
      overtimeRates: Number(form.overtimeRates) || 0, shiftStart: form.shiftStart, shiftEnd: form.shiftEnd,
      joiningDate: form.joiningDate, weekOffDay: form.weekOffDay || 'Sunday',
    })
    onClose()
  }

  if (!worker) return null

  return (
    <Modal open={open} onClose={onClose} eyebrow="Workers" title={`Edit ${worker.name}`} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit}>Save changes</Button></>}>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Field label="Full name" required><input className={inputClass} value={form.name || ''} onChange={(e) => set('name', e.target.value)} /></Field></div>
        <div className="col-span-2"><Field label="Address"><input className={inputClass} value={form.address || ''} onChange={(e) => set('address', e.target.value)} /></Field></div>
        <Field label="Phone"><input className={inputClass} value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} /></Field>
        <Field label="Joining date"><input type="date" className={inputClass} value={form.joiningDate || ''} onChange={(e) => set('joiningDate', e.target.value)} /></Field>
        <div className="col-span-2"><AadhaarField value={form.aadhaarNumber || ''} onChange={(v) => set('aadhaarNumber', v)} /></div>
        <div className="col-span-2"><PhotoCapture photo={form.photo || ''} onChange={(photo) => set('photo', photo)} /></div>
        <div className="col-span-2">
          <span className="mb-1.5 block text-xs font-medium text-espresso/70">Roles</span>
          <div className="flex flex-wrap gap-2">
            {allRoles.map((r) => (
              <button key={r} type="button" onClick={() => toggleRole(r)} className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium transition ${form.roles?.includes(r) ? roleConfig[r].className : 'border-espresso/15 bg-crust/30 text-espresso/50 hover:bg-crust/50'}`}>
                {roleConfig[r].label}
              </button>
            ))}
          </div>
        </div>
        <Field label="Monthly salary (₹)"><input type="number" className={inputClass} value={form.monthlySalary ?? ''} onChange={(e) => set('monthlySalary', e.target.value)} /></Field>
        <Field label="Overtime rate (₹/hr)"><input type="number" className={inputClass} value={form.overtimeRates ?? ''} onChange={(e) => set('overtimeRates', e.target.value)} /></Field>
        <Field label="Shift start"><input type="time" className={inputClass} value={form.shiftStart || ''} onChange={(e) => set('shiftStart', e.target.value)} /></Field>
        <Field label="Shift end"><input type="time" className={inputClass} value={form.shiftEnd || ''} onChange={(e) => set('shiftEnd', e.target.value)} /></Field>
        <Field label="Week off day">
          <select className={inputClass} value={form.weekOffDay || 'Sunday'} onChange={(e) => set('weekOffDay', e.target.value)}>
            {dayNames.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </Field>
      </div>
    </Modal>
  )
}

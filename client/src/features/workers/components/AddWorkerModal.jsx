import { useState } from 'react'
import { useWorkers } from '../hooks'
import { Button, Field, Modal, inputClass } from '@/components/shared'
import { AadhaarField } from './AadhaarField'
import { PhotoCapture } from './PhotoCapture'
import { roleConfig } from './RoleBadge'
import { dayNames } from '../utils'
import { todayISO } from '@/utils'

const allRoles = ['chef', 'labour', 'delivery', 'marketer']

export function AddWorkerModal({ open, onClose }) {
  const { addWorker } = useWorkers()
  const [form, setForm] = useState({
    name: '', address: '', phone: '', aadhaarNumber: '', photo: '',
    roles: [], monthlySalary: '', overtimeRates: '', shiftStart: '08:00', shiftEnd: '16:00',
    joiningDate: todayISO(), weekOffDay: 'Sunday',
  })

  const toggleRole = (r) => setForm((f) => ({ ...f, roles: f.roles.includes(r) ? f.roles.filter((x) => x !== r) : [...f.roles, r] }))

  const submit = () => {
    if (!form.name) return
    addWorker(form)
    setForm({ name: '', address: '', phone: '', aadhaarNumber: '', photo: '', roles: [], monthlySalary: '', overtimeRates: '', shiftStart: '08:00', shiftEnd: '16:00', joiningDate: todayISO(), weekOffDay: 'Sunday' })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} eyebrow="Workers" title="Add worker" footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit}>Add worker</Button></>}>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Field label="Full name" required><input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field></div>
        <div className="col-span-2"><Field label="Address"><input className={inputClass} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field></div>
        <Field label="Phone"><input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
        <Field label="Joining date"><input type="date" className={inputClass} value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} /></Field>
        <div className="col-span-2"><AadhaarField value={form.aadhaarNumber} onChange={(v) => setForm({ ...form, aadhaarNumber: v })} /></div>
        <div className="col-span-2"><PhotoCapture photo={form.photo} onChange={(photo) => setForm({ ...form, photo })} /></div>
        <div className="col-span-2">
          <span className="mb-1.5 block text-xs font-medium text-espresso/70">Roles</span>
          <div className="flex flex-wrap gap-2">
            {allRoles.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => toggleRole(r)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${form.roles.includes(r) ? roleConfig[r].className : 'border-espresso/15 bg-crust/30 text-espresso/50 hover:bg-crust/50'}`}
              >
                {roleConfig[r].label}
              </button>
            ))}
          </div>
        </div>
        <Field label="Monthly salary (₹)"><input type="number" className={inputClass} value={form.monthlySalary} onChange={(e) => setForm({ ...form, monthlySalary: e.target.value })} /></Field>
        <Field label="Overtime rate (₹/hr)"><input type="number" className={inputClass} value={form.overtimeRates} onChange={(e) => setForm({ ...form, overtimeRates: e.target.value })} /></Field>
        <Field label="Shift start"><input type="time" className={inputClass} value={form.shiftStart} onChange={(e) => setForm({ ...form, shiftStart: e.target.value })} /></Field>
        <Field label="Shift end"><input type="time" className={inputClass} value={form.shiftEnd} onChange={(e) => setForm({ ...form, shiftEnd: e.target.value })} /></Field>
        <Field label="Week off day">
          <select className={inputClass} value={form.weekOffDay} onChange={(e) => setForm({ ...form, weekOffDay: e.target.value })}>
            {dayNames.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </Field>
      </div>
    </Modal>
  )
}

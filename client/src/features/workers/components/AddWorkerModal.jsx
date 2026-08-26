import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { useCreateWorker } from '../hooks'
import { uploadWorkerPhoto } from '@/lib/uploadWorkerPhoto'
import { Button, Field, Modal, inputClass } from '@/components/shared'
import { AadhaarField } from './AadhaarField'
import { PhotoCapture } from './PhotoCapture'
import { roleConfig } from './RoleBadge'
import { dayNames } from '../utils'
import { todayISO } from '@/utils'

const allRoles = ['chef', 'labour', 'delivery', 'marketer']

const emptyForm = () => ({
  name: '', address: '', phone: '', aadhaarNumber: '', photo: null,
  roles: [], monthlySalary: '', overtimeRate: '', shiftStart: '08:00', shiftEnd: '16:00',
  joiningDate: todayISO(), weekOffDay: 'Sunday',
})

export function AddWorkerModal({ open, onClose }) {
  const createWorker = useCreateWorker()
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

  const toggleRole = (r) => setForm((f) => ({ ...f, roles: f.roles.includes(r) ? f.roles.filter((x) => x !== r) : [...f.roles, r] }))

  const submit = async () => {
    if (!form.name) return
    setError('')

    try {
      const photoKey = form.photo instanceof File ? await uploadWorkerPhoto(form.photo) : undefined

      await createWorker.mutateAsync({
        name: form.name,
        address: form.address || undefined,
        phone: form.phone || undefined,
        aadhaarNumber: form.aadhaarNumber || undefined,
        photoKey,
        joiningDate: form.joiningDate,
        roles: form.roles,
        monthlySalary: form.monthlySalary || 0,
        overtimeRate: form.overtimeRate || 0,
        shiftStart: form.shiftStart,
        shiftEnd: form.shiftEnd,
        weekOffDay: form.weekOffDay,
      })
      setForm(emptyForm())
      onClose()
    } catch (err) {
      setError(err.message || 'Could not add worker.')
    }
  }

  const busy = createWorker.isPending

  return (
    <Modal open={open} onClose={onClose} eyebrow="Workers" title="Add worker" footer={<><Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button><Button onClick={submit} disabled={busy}>{busy ? 'Adding…' : 'Add worker'}</Button></>}>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Field label="Full name" required><input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field></div>
        <div className="col-span-2"><Field label="Address"><input className={inputClass} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field></div>
        <Field label="Phone"><input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
        <Field label="Joining date"><input type="date" className={inputClass} value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} /></Field>
        <div className="col-span-2"><AadhaarField value={form.aadhaarNumber} onChange={(v) => setForm({ ...form, aadhaarNumber: v })} /></div>
        <div className="col-span-2"><PhotoCapture value={form.photo} onChange={(photo) => setForm({ ...form, photo })} /></div>
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
        <Field label="Overtime rate (₹/hr)"><input type="number" className={inputClass} value={form.overtimeRate} onChange={(e) => setForm({ ...form, overtimeRate: e.target.value })} /></Field>
        <Field label="Shift start"><input type="time" className={inputClass} value={form.shiftStart} onChange={(e) => setForm({ ...form, shiftStart: e.target.value })} /></Field>
        <Field label="Shift end"><input type="time" className={inputClass} value={form.shiftEnd} onChange={(e) => setForm({ ...form, shiftEnd: e.target.value })} /></Field>
        <Field label="Week off day">
          <select className={inputClass} value={form.weekOffDay} onChange={(e) => setForm({ ...form, weekOffDay: e.target.value })}>
            {dayNames.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </Field>
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

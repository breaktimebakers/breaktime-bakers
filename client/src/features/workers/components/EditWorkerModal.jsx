import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { useUpdateWorker } from '../hooks'
import { uploadWorkerPhoto } from '@/lib/uploadWorkerPhoto'
import { Button, Field, Modal, inputClass } from '@/components/shared'
import { AadhaarField } from './AadhaarField'
import { PhotoCapture } from './PhotoCapture'
import { roleConfig } from './RoleBadge'
import { dayNames } from '../utils'

const allRoles = ['chef', 'labour', 'delivery', 'marketer']

export function EditWorkerModal({ open, onClose, worker }) {
  const updateWorker = useUpdateWorker()
  const [form, setForm] = useState(() => worker ? { ...worker, photo: worker.photoUrl || null } : {})
  const [error, setError] = useState('')

  const set = (field, val) => setForm((f) => ({ ...f, [field]: val }))
  const toggleRole = (r) => set('roles', form.roles.includes(r) ? form.roles.filter((x) => x !== r) : [...form.roles, r])

  const submit = async () => {
    if (!form.name) return
    setError('')

    try {
      // photoKey is only included when the photo actually changed this
      // session - omitted, the backend leaves the worker's current photo
      // untouched; explicit null clears it (see worker.repository.js).
      let photoKey
      if (form.photo instanceof File) photoKey = await uploadWorkerPhoto(form.photo)
      else if (!form.photo) photoKey = null

      await updateWorker.mutateAsync({
        id: worker.id,
        body: {
          name: form.name,
          address: form.address || undefined,
          phone: form.phone || undefined,
          aadhaarNumber: form.aadhaarNumber || undefined,
          photoKey,
          joiningDate: form.joiningDate,
          roles: form.roles,
          monthlySalary: Number(form.monthlySalary) || 0,
          overtimeRate: Number(form.overtimeRate) || 0,
          shiftStart: form.shiftStart,
          shiftEnd: form.shiftEnd,
          weekOffDay: form.weekOffDay || 'Sunday',
        },
      })
      onClose()
    } catch (err) {
      setError(err.message || 'Could not update worker.')
    }
  }

  if (!worker) return null

  const busy = updateWorker.isPending

  return (
    <Modal open={open} onClose={onClose} eyebrow="Workers" title={`Edit ${worker.name}`} footer={<><Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button><Button onClick={submit} disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</Button></>}>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Field label="Full name" required><input className={inputClass} value={form.name || ''} onChange={(e) => set('name', e.target.value)} /></Field></div>
        <div className="col-span-2"><Field label="Address"><input className={inputClass} value={form.address || ''} onChange={(e) => set('address', e.target.value)} /></Field></div>
        <Field label="Phone"><input className={inputClass} value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} /></Field>
        <Field label="Joining date"><input type="date" className={inputClass} value={form.joiningDate || ''} onChange={(e) => set('joiningDate', e.target.value)} /></Field>
        <div className="col-span-2"><AadhaarField value={form.aadhaarNumber || ''} onChange={(v) => set('aadhaarNumber', v)} /></div>
        <div className="col-span-2"><PhotoCapture value={form.photo} onChange={(photo) => set('photo', photo)} /></div>
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
        <Field label="Overtime rate (₹/hr)"><input type="number" className={inputClass} value={form.overtimeRate ?? ''} onChange={(e) => set('overtimeRate', e.target.value)} /></Field>
        <Field label="Shift start"><input type="time" className={inputClass} value={form.shiftStart || ''} onChange={(e) => set('shiftStart', e.target.value)} /></Field>
        <Field label="Shift end"><input type="time" className={inputClass} value={form.shiftEnd || ''} onChange={(e) => set('shiftEnd', e.target.value)} /></Field>
        <Field label="Week off day">
          <select className={inputClass} value={form.weekOffDay || 'Sunday'} onChange={(e) => set('weekOffDay', e.target.value)}>
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

import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { useCreateAdvance } from '../hooks'
import { Button, Field, Modal, inputClass } from '@/components/shared'
import { todayISO } from '@/utils'

// availableThisMonth is the worker's computed salary so far this month
// minus advances already given this month - the hard cap on this modal,
// per the "never advance more than what's already earned" rule (see
// computeGrossSalaryForMonth / sumAdvancesForMonth in ../utils).
export function AddAdvanceModal({ open, onClose, worker, availableThisMonth }) {
  const createAdvance = useCreateAdvance()
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(todayISO())
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  const reset = () => {
    setAmount('')
    setDate(todayISO())
    setNote('')
    setError('')
  }

  const close = () => {
    reset()
    onClose()
  }

  const submit = async () => {
    const value = Number(amount)
    if (!value || value <= 0) {
      setError('Enter an amount greater than 0.')
      return
    }
    if (value > availableThisMonth) {
      setError(`Cannot advance more than the ₹${availableThisMonth.toLocaleString('en-IN', { maximumFractionDigits: 0 })} already earned this month.`)
      return
    }

    setError('')
    try {
      await createAdvance.mutateAsync({ workerId: worker.id, date, amount: value, note: note || undefined })
      close()
    } catch (err) {
      setError(err.message || 'Could not record advance.')
    }
  }

  const busy = createAdvance.isPending

  return (
    <Modal
      open={open}
      onClose={close}
      eyebrow="Advance"
      title={`Give advance — ${worker?.name || ''}`}
      footer={<><Button variant="secondary" onClick={close} disabled={busy}>Cancel</Button><Button onClick={submit} disabled={busy}>{busy ? 'Saving…' : 'Record advance'}</Button></>}
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Amount (₹)" required><input type="number" className={inputClass} value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus /></Field>
        <Field label="Date"><input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <div className="col-span-2"><Field label="Note"><input className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" /></Field></div>
        <p className="col-span-2 text-xs text-espresso/40">Available to advance this month: ₹{availableThisMonth.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
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

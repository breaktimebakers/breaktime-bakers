import { useState, useMemo } from 'react'
import { Plus, Trash2, Landmark } from 'lucide-react'
import { useFinance } from '@/features/finance/hooks'
import { Button, EmptyState, Field, Modal, PageHeader, inputClass } from '@/components/shared'
import { MonthFilterBar } from '../components/MonthFilterBar'

export default function Taxes() {
  const { taxEntries, addTaxEntry, deleteTaxEntry } = useFinance()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ amount: '', date: new Date().toISOString().slice(0, 10), note: '' })

  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`
  const filtered = useMemo(() => {
    return taxEntries
      .filter((t) => t.date.startsWith(monthStr))
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [taxEntries, monthStr])

  const totalAmount = filtered.reduce((s, t) => s + t.amount, 0)

  const handleSubmit = () => {
    if (!form.amount) return
    addTaxEntry({ amount: form.amount, date: form.date, note: form.note })
    setForm({ amount: '', date: new Date().toISOString().slice(0, 10), note: '' })
    setModalOpen(false)
  }

  return (
    <div>
      <PageHeader
        eyebrow="Finance / Taxes"
        title="Taxes"
        description="Record tax payments like GST."
        actions={<Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> Add tax entry</Button>}
      />

      <MonthFilterBar year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m) }} />

      {/* Monthly total */}
      <div className="mb-4 rounded-bakery border border-espresso/8 bg-proof-cream p-5 shadow-bakery">
        <p className="font-mono text-[10px] uppercase tracking-wider text-espresso/50">Total for this month</p>
        <p className="mt-1 font-mono text-3xl font-bold text-espresso">₹{totalAmount.toLocaleString('en-IN')}</p>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Landmark} title="No tax entries this month" description="Add a tax entry to get started." />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((t) => (
            <div key={t.id} className="flex items-center gap-3 rounded-bakery border border-espresso/8 bg-proof-cream p-4 shadow-bakery transition hover:shadow-bakery-lg">
              <div className="flex h-9 w-9 items-center justify-center rounded-bakery bg-espresso/5 text-espresso/50">
                <Landmark className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                {t.note && <p className="truncate text-sm text-espresso/70">{t.note}</p>}
                <p className="font-mono text-xs text-espresso/40">{new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              </div>
              <p className="font-mono font-semibold text-espresso">₹{t.amount.toLocaleString('en-IN')}</p>
              <button
                onClick={() => deleteTaxEntry(t.id)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-espresso/30 hover:bg-cherry-compote/10 hover:text-cherry-compote"
                aria-label="Delete tax entry"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add tax entry modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        eyebrow="Finance"
        title="Add Tax Entry"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Save</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Amount (₹)" required>
            <input type="number" className={inputClass} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" autoFocus />
          </Field>
          <Field label="Date" required>
            <input type="date" className={inputClass} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>
          <Field label="Note">
            <input type="text" className={inputClass} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="e.g. GST payment for July" />
          </Field>
        </div>
      </Modal>
    </div>
  )
}

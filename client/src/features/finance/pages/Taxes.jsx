import { useState, useMemo } from 'react'
import { Plus, Trash2, Landmark, Paperclip, AlertCircle } from 'lucide-react'
import { useTaxEntries, useCreateTaxEntry, useDeleteTaxEntry } from '@/features/finance/hooks'
import { uploadTaxBill } from '@/lib/uploadTaxBill'
import { Button, EmptyState, Field, FileViewerModal, Modal, ReceiptDropzone, PageHeader, inputClass, MonthFilterBar } from '@/components/shared'

export default function Taxes() {
  const { data: taxEntries = [], isLoading, isError } = useTaxEntries()
  const createTaxEntry = useCreateTaxEntry()
  const deleteTaxEntry = useDeleteTaxEntry()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ amount: '', date: new Date().toISOString().slice(0, 10), note: '', bill: null })
  const [error, setError] = useState('')
  const [viewingBill, setViewingBill] = useState(null)

  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`
  const filtered = useMemo(() => {
    return taxEntries
      .filter((t) => t.date.startsWith(monthStr))
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [taxEntries, monthStr])

  const totalAmount = filtered.reduce((s, t) => s + t.amount, 0)

  const handleSubmit = async () => {
    if (!form.amount) return
    setError('')

    try {
      const billKey = form.bill instanceof File ? await uploadTaxBill(form.bill) : undefined

      await createTaxEntry.mutateAsync({ amount: form.amount, date: form.date, note: form.note || undefined, billKey })
      setForm({ amount: '', date: new Date().toISOString().slice(0, 10), note: '', bill: null })
      setModalOpen(false)
    } catch (err) {
      setError(err.message || 'Could not add tax entry.')
    }
  }

  const busy = createTaxEntry.isPending

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

      {isLoading ? (
        <p className="px-1 py-8 text-center text-sm text-espresso/40">Loading tax entries...</p>
      ) : isError ? (
        <EmptyState icon={Landmark} title="Could not load tax entries" description="Something went wrong fetching tax entries. Try refreshing." />
      ) : filtered.length === 0 ? (
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
              {t.billUrl && (
                <button
                  onClick={() => setViewingBill({ url: t.billUrl, title: `Tax entry — ${t.date}` })}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-espresso/30 hover:bg-oven-amber/10 hover:text-oven-amber"
                  aria-label="View bill"
                  title="View bill"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => deleteTaxEntry.mutate(t.id)}
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
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={busy}>{busy ? 'Saving…' : 'Save'}</Button>
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
          <Field label="Bill">
            <ReceiptDropzone
              value={form.bill}
              onChange={(bill) => setForm({ ...form, bill })}
              label="Drop bill or click to upload"
            />
          </Field>
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-cherry-compote/10 px-3 py-2 text-sm text-cherry-compote">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </Modal>

      <FileViewerModal
        open={!!viewingBill}
        onClose={() => setViewingBill(null)}
        fileUrl={viewingBill?.url}
        title={viewingBill?.title}
        eyebrow="Tax entry bill"
        emptyLabel="No bill available for this tax entry."
      />
    </div>
  )
}

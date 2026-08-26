import { useState, useMemo } from 'react'
import { Plus, Trash2, Receipt, Paperclip, AlertCircle } from 'lucide-react'
import { useExpenses, useCreateExpense, useDeleteExpense } from '@/features/finance/hooks'
import { expenseCategories } from '@/features/finance/data/seedFinance'
import { uploadExpenseBill } from '@/lib/uploadExpenseBill'
import { Button, EmptyState, Field, FileViewerModal, Modal, ReceiptDropzone, PageHeader, inputClass } from '@/components/shared'
import { CategoryPill, getCategoryIcon } from '../components/CategoryPill'

const periodFilters = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'all', label: 'All' },
]

export default function Expenses() {
  const { data: expenses = [], isLoading, isError } = useExpenses()
  const createExpense = useCreateExpense()
  const deleteExpense = useDeleteExpense()
  const [modalOpen, setModalOpen] = useState(false)
  const [period, setPeriod] = useState('month')
  const [form, setForm] = useState({ category: 'Electricity', amount: '', date: new Date().toISOString().slice(0, 10), note: '', bill: null })
  const [error, setError] = useState('')
  const [viewingBill, setViewingBill] = useState(null)

  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const weekAgo = new Date(now)
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekAgoStr = weekAgo.toISOString().slice(0, 10)
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      if (period === 'today') return e.date === todayStr
      if (period === 'week') return e.date >= weekAgoStr
      if (period === 'month') return e.date.startsWith(monthStr)
      return true
    }).sort((a, b) => b.date.localeCompare(a.date))
  }, [expenses, period, todayStr, weekAgoStr, monthStr])

  const totalAmount = filtered.reduce((s, e) => s + e.amount, 0)

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const map = {}
    filtered.forEach((e) => {
      if (!map[e.category]) map[e.category] = { total: 0, icon: expenseCategories.find((c) => c.label === e.category)?.icon || 'MoreHorizontal' }
      map[e.category].total += e.amount
    })
    return Object.entries(map)
      .map(([cat, data]) => ({ category: cat, ...data }))
      .sort((a, b) => b.total - a.total)
  }, [filtered])

  const maxCategoryTotal = Math.max(...categoryBreakdown.map((c) => c.total), 1)

  const handleSubmit = async () => {
    if (!form.amount || !form.category) return
    setError('')

    try {
      const billKey = form.bill instanceof File ? await uploadExpenseBill(form.bill) : undefined

      await createExpense.mutateAsync({ category: form.category, amount: form.amount, date: form.date, note: form.note || undefined, billKey })
      setForm({ category: 'Electricity', amount: '', date: new Date().toISOString().slice(0, 10), note: '', bill: null })
      setModalOpen(false)
    } catch (err) {
      setError(err.message || 'Could not add expense.')
    }
  }

  const busy = createExpense.isPending

  return (
    <div>
      <PageHeader
        eyebrow="Finance / Expenses"
        title="Expenses"
        description="Track and categorize all business expenses."
        actions={<Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> Add expense</Button>}
      />

      {/* Period filter pills */}
      <div className="mb-4 inline-flex rounded-full bg-crust p-0.5">
        {periodFilters.map((f) => (
          <button
            key={f.key}
            onClick={() => setPeriod(f.key)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${period === f.key ? 'bg-espresso text-crust' : 'text-espresso/60'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Total */}
      <div className="mb-4 rounded-bakery border border-espresso/8 bg-proof-cream p-4 shadow-bakery">
        <p className="font-mono text-[10px] uppercase tracking-wider text-espresso/50">Total for selected period</p>
        <p className="mt-1 font-mono text-2xl font-bold text-espresso">₹{totalAmount.toLocaleString('en-IN')}</p>
      </div>

      {/* Category breakdown */}
      {categoryBreakdown.length > 0 && (
        <div className="mb-4 rounded-bakery border border-espresso/8 bg-proof-cream p-5 shadow-bakery">
          <h3 className="mb-3 font-display text-lg font-semibold text-espresso">By Category</h3>
          <div className="flex flex-col gap-2">
            {categoryBreakdown.map((c) => {
              const Icon = getCategoryIcon(c.icon)
              return (
                <div key={c.category} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-espresso/5 text-espresso/60">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-espresso/70">{c.category}</span>
                      <span className="font-mono text-sm font-medium text-espresso">₹{c.total.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-crust/40">
                      <div className="h-full rounded-full bg-oven-amber/60" style={{ width: `${(c.total / maxCategoryTotal) * 100}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Expense entries list */}
      {isLoading ? (
        <p className="px-1 py-8 text-center text-sm text-espresso/40">Loading expenses...</p>
      ) : isError ? (
        <EmptyState icon={Receipt} title="Could not load expenses" description="Something went wrong fetching expenses. Try refreshing." />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Receipt} title="No expenses found" description="Add an expense to get started." />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((e) => {
            const catCfg = expenseCategories.find((c) => c.label === e.category)
            return (
              <div key={e.id} className="flex items-center gap-3 rounded-bakery border border-espresso/8 bg-proof-cream p-4 shadow-bakery transition hover:shadow-bakery-lg">
                <CategoryPill category={e.category} icon={catCfg?.icon} />
                <div className="min-w-0 flex-1">
                  {e.note && <p className="truncate text-sm text-espresso/60">{e.note}</p>}
                  <p className="font-mono text-xs text-espresso/40">{new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
                <p className="font-mono font-semibold text-espresso">₹{e.amount.toLocaleString('en-IN')}</p>
                {e.billUrl && (
                  <button
                    onClick={() => setViewingBill({ url: e.billUrl, title: `${e.category} — ${e.date}` })}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-espresso/30 hover:bg-oven-amber/10 hover:text-oven-amber"
                    aria-label="View bill"
                    title="View bill"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => deleteExpense.mutate(e.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-espresso/30 hover:bg-cherry-compote/10 hover:text-cherry-compote"
                  aria-label="Delete expense"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Add expense modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        eyebrow="Finance"
        title="Add Expense"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={busy}>{busy ? 'Saving…' : 'Save'}</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Category" required>
            <select className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {expenseCategories.map((c) => <option key={c.label} value={c.label}>{c.label}</option>)}
            </select>
          </Field>
          <Field label="Amount (₹)" required>
            <input type="number" className={inputClass} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" autoFocus />
          </Field>
          <Field label="Date" required>
            <input type="date" className={inputClass} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>
          <Field label="Note">
            <input type="text" className={inputClass} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Optional note" />
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
        eyebrow="Expense bill"
        emptyLabel="No bill available for this expense."
      />
    </div>
  )
}

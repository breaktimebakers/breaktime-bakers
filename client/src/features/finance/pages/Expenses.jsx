import { useState, useMemo } from 'react'
import { Plus, Trash2, Receipt, Paperclip, AlertCircle } from 'lucide-react'
import { useExpenses, useCreateExpense, useDeleteExpense } from '@/features/finance/hooks'
import { expenseCategories } from '@/features/finance/data/seedFinance'
import { uploadExpenseBill } from '@/lib/uploadExpenseBill'
import { Button, EmptyState, Field, FileViewerModal, Modal, ReceiptDropzone, PageHeader, inputClass } from '@/components/shared'
import { CategoryPill, getCategoryIcon } from '../components/CategoryPill'
import { todayISO, daysAgoISO } from '@/utils'

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
  const [form, setForm] = useState({ category: 'Electricity', amount: '', date: todayISO(), note: '', bill: null })
  const [error, setError] = useState('')
  const [viewingBill, setViewingBill] = useState(null)

  const now = new Date()
  const todayStr = todayISO()
  const weekAgoStr = daysAgoISO(6)
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
      setForm({ category: 'Electricity', amount: '', date: todayISO(), note: '', bill: null })
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
        <div className="overflow-hidden rounded-bakery border border-espresso/8 bg-proof-cream shadow-bakery">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-espresso/10 bg-crust/30 text-left">
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Category</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Note</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Date</th>
                  <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-espresso/50">Amount</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Bill</th>
                  <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-espresso/50">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => {
                  const catCfg = expenseCategories.find((c) => c.label === e.category)
                  return (
                    <tr key={e.id} className="border-b border-espresso/8 last:border-0 hover:bg-crust/20">
                      <td className="px-4 py-3"><CategoryPill category={e.category} icon={catCfg?.icon} /></td>
                      <td className="px-4 py-3 max-w-[240px] truncate text-espresso/60">{e.note || '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs text-espresso/50">{new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-espresso">₹{e.amount.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3">
                        {e.billUrl ? (
                          <button
                            onClick={() => setViewingBill({ url: e.billUrl, title: `${e.category} — ${e.date}` })}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-oven-amber/10 px-2.5 py-1.5 text-xs font-medium text-oven-amber hover:bg-oven-amber/20"
                          >
                            <Paperclip className="h-3.5 w-3.5" /> View
                          </button>
                        ) : (
                          <span className="text-xs text-espresso/30">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => deleteExpense.mutate(e.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-espresso/30 hover:bg-cherry-compote/10 hover:text-cherry-compote"
                          aria-label="Delete expense"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
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

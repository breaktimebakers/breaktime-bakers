import { useEffect, useState } from 'react'
import { Users, Eye, EyeOff, CircleCheck, Circle } from 'lucide-react'
import { usePayroll, useMarkSalaryPaid, useMarkSalaryUnpaid, useBulkMarkSalaryPaid } from '@/features/finance/hooks'
import { Button, EmptyState, ErrorState, PageHeader, MonthFilterBar, monthNames } from '@/components/shared'
import { RoleBadge } from '@/features/workers/components/RoleBadge'
import { todayISO } from '@/utils'

export default function Salary() {
  const [todayYear, todayMonth] = todayISO().split('-').map(Number)
  const [year, setYear] = useState(todayYear)
  const [month, setMonth] = useState(todayMonth - 1)
  const [showLeft, setShowLeft] = useState(false)
  const [selected, setSelected] = useState(() => new Set())
  const payrollQuery = usePayroll({ year, month, includeLeft: showLeft })
  const markPaid = useMarkSalaryPaid()
  const markUnpaid = useMarkSalaryUnpaid()
  const bulkMarkPaidMutation = useBulkMarkSalaryPaid()

  const rows = payrollQuery.data?.rows || []
  const summary = payrollQuery.data?.summary
  const totalNetPayable = summary?.totalNetPayable || 0
  const totalPaid = summary?.totalPaid || 0
  const totalUnpaid = summary?.totalUnpaid || 0
  const mutationBusy = markPaid.isPending || markUnpaid.isPending || bulkMarkPaidMutation.isPending
  const futurePeriod = year > todayYear || (year === todayYear && month > todayMonth - 1)

  useEffect(() => {
    setSelected(new Set())
  }, [year, month, showLeft])

  const toggleSelected = (workerId) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(workerId)) next.delete(workerId)
      else next.add(workerId)
      return next
    })
  }

  const unpaidRows = rows.filter((r) => !r.paid)
  const allUnpaidSelected = unpaidRows.length > 0 && unpaidRows.every((r) => selected.has(r.worker.id))

  const toggleSelectAll = () => {
    if (allUnpaidSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(unpaidRows.map((r) => r.worker.id)))
    }
  }

  const togglePaid = (row) => {
    if (row.paid) markUnpaid.mutate({ workerId: row.worker.id, year, month })
    else markPaid.mutate(
      { workerId: row.worker.id, year, month },
      {
        onSuccess: () => setSelected((current) => {
          const next = new Set(current)
          next.delete(row.worker.id)
          return next
        }),
      },
    )
  }

  const bulkMarkPaid = () => {
    bulkMarkPaidMutation.mutate(
      { workerIds: [...selected], year, month },
      { onSuccess: () => setSelected(new Set()) },
    )
  }

  return (
    <div>
      <PageHeader
        eyebrow="Finance / Salary"
        title="Salary"
        description="Prorated worker pay based on attendance, advances, and overtime."
        actions={
          <button
            onClick={() => setShowLeft((s) => !s)}
            disabled={payrollQuery.isFetching}
            className="inline-flex items-center gap-2 rounded-lg border border-espresso/15 bg-proof-cream px-3 py-2 text-sm font-medium text-espresso/70 hover:bg-sourdough/40"
          >
            {showLeft ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showLeft ? 'Hide left workers' : 'Show left workers'}
          </button>
        }
      />

      <MonthFilterBar year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m) }} />

      {/* Paid changes with the month filter above (what went out that month);
          Unpaid is deliberately a running total across every month (what's still owed) */}
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-bakery border border-matcha-glaze/20 bg-matcha-glaze/5 p-4 shadow-bakery">
          <p className="font-mono text-[10px] uppercase tracking-wider text-espresso/50">Paid — {monthNames[month]} {year}</p>
          <p className="mt-1 font-mono text-2xl font-bold text-matcha-glaze">{payrollQuery.isLoading ? '—' : `₹${totalPaid.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}</p>
          <p className="mt-0.5 text-xs text-espresso/40">Advances given + salaries marked paid this month</p>
        </div>
        <div className="rounded-bakery border border-cherry-compote/20 bg-cherry-compote/5 p-4 shadow-bakery">
          <p className="font-mono text-[10px] uppercase tracking-wider text-espresso/50">Unpaid (pending, all-time)</p>
          <p className="mt-1 font-mono text-2xl font-bold text-cherry-compote">{payrollQuery.isLoading ? '—' : `₹${totalUnpaid.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}</p>
          <p className="mt-0.5 text-xs text-espresso/40">Net payable still owed, every month not yet marked paid</p>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-bakery border border-oven-amber/30 bg-oven-amber/10 px-4 py-3">
          <p className="text-sm font-medium text-espresso">{selected.size} worker{selected.size === 1 ? '' : 's'} selected</p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => setSelected(new Set())} disabled={mutationBusy}>Clear</Button>
            <Button size="sm" onClick={bulkMarkPaid} disabled={mutationBusy}>{bulkMarkPaidMutation.isPending ? 'Saving…' : `Mark ${selected.size} as Paid`}</Button>
          </div>
        </div>
      )}

      {payrollQuery.isError ? (
        <ErrorState description="Could not load payroll." onRetry={payrollQuery.refetch} retrying={payrollQuery.isFetching} />
      ) : payrollQuery.isLoading ? (
        <div role="status" className="space-y-3 rounded-bakery border border-espresso/8 bg-proof-cream p-5 shadow-bakery">
          {[1, 2, 3, 4].map((item) => <div key={item} className="h-12 animate-pulse rounded-lg bg-crust/60" />)}
          <span className="sr-only">Loading payroll…</span>
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon={Users} title="No workers to show" description="No workers were employed during this salary period." />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-bakery border border-espresso/8 bg-proof-cream shadow-bakery lg:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-espresso/10 bg-crust/30 text-left">
                    <th className="px-4 py-3">
                      <input type="checkbox" checked={allUnpaidSelected} onChange={toggleSelectAll} disabled={unpaidRows.length === 0 || mutationBusy || futurePeriod} className="h-4 w-4 accent-oven-amber" />
                    </th>
                    <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Worker</th>
                    <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Roles</th>
                    <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-espresso/50">Monthly Salary</th>
                    <th className="px-4 py-3 text-center font-mono text-[10px] uppercase tracking-wider text-espresso/50">Present</th>
                    <th className="px-4 py-3 text-center font-mono text-[10px] uppercase tracking-wider text-espresso/50">Half-day</th>
                    <th className="px-4 py-3 text-center font-mono text-[10px] uppercase tracking-wider text-espresso/50">OT hrs</th>
                    <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-espresso/50">Advance</th>
                    <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-espresso/50">Net Payable</th>
                    <th className="px-4 py-3 text-center font-mono text-[10px] uppercase tracking-wider text-espresso/50">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.worker.id} className="border-b border-espresso/8 last:border-0 hover:bg-crust/20">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(r.worker.id)}
                          onChange={() => toggleSelected(r.worker.id)}
                          disabled={r.paid || mutationBusy || futurePeriod}
                          className="h-4 w-4 accent-oven-amber"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-espresso">{r.worker.name}</span>
                          {r.worker.status === 'left' && <span className="rounded-full bg-espresso/8 px-2 py-0.5 text-[10px] text-espresso/50">Left</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {r.worker.roles.map((role) => <RoleBadge key={role} role={role} />)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-espresso/70">₹{r.worker.monthlySalary.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-center font-mono text-matcha-glaze">{r.present}</td>
                      <td className="px-4 py-3 text-center font-mono text-toasted-sesame">{r.half}</td>
                      <td className="px-4 py-3 text-center font-mono text-espresso/60">{r.overtime}</td>
                      <td className="px-4 py-3 text-right font-mono text-espresso/60">{r.advance > 0 ? `₹${r.advance.toLocaleString('en-IN')}` : '—'}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-espresso">₹{r.netPayable.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => togglePaid(r)}
                          disabled={mutationBusy || (futurePeriod && !r.paid)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition ${r.paid ? 'bg-matcha-glaze/15 text-matcha-glaze hover:bg-matcha-glaze/25' : 'bg-espresso/8 text-espresso/50 hover:bg-espresso/15'}`}
                        >
                          {r.paid ? <CircleCheck className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                          {r.paid ? 'Paid' : 'Not paid'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-espresso/15 bg-crust/30">
                    <td colSpan={8} className="px-4 py-3 text-right font-mono text-xs uppercase tracking-wider text-espresso/50">Total ({new Date(year, month).toLocaleDateString('en-IN', { month: 'long' })})</td>
                    <td className="px-4 py-3 text-right font-mono text-lg font-bold text-espresso">₹{totalNetPayable.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Mobile card list */}
          <div className="flex flex-col gap-3 lg:hidden">
            {rows.map((r) => (
              <div key={r.worker.id} className="rounded-bakery border border-espresso/8 bg-proof-cream p-4 shadow-bakery">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={selected.has(r.worker.id)}
                      onChange={() => toggleSelected(r.worker.id)}
                      disabled={r.paid || mutationBusy || futurePeriod}
                      className="mt-1 h-4 w-4 accent-oven-amber"
                    />
                    <div>
                      <p className="font-medium text-espresso">{r.worker.name}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {r.worker.roles.map((role) => <RoleBadge key={role} role={role} />)}
                      </div>
                    </div>
                  </div>
                  <p className="font-mono text-lg font-bold text-espresso">₹{r.netPayable.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                  <div><p className="font-mono text-[10px] uppercase text-espresso/40">Present</p><p className="font-mono text-sm font-bold text-matcha-glaze">{r.present}</p></div>
                  <div><p className="font-mono text-[10px] uppercase text-espresso/40">Half-day</p><p className="font-mono text-sm font-bold text-toasted-sesame">{r.half}</p></div>
                  <div><p className="font-mono text-[10px] uppercase text-espresso/40">OT hrs</p><p className="font-mono text-sm font-bold text-espresso/60">{r.overtime}</p></div>
                  <div><p className="font-mono text-[10px] uppercase text-espresso/40">Advance</p><p className="font-mono text-sm font-bold text-espresso/60">{r.advance > 0 ? `₹${r.advance.toLocaleString('en-IN')}` : '—'}</p></div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-espresso/40">Monthly salary: ₹{r.worker.monthlySalary.toLocaleString('en-IN')}</p>
                  <button
                    onClick={() => togglePaid(r)}
                    disabled={mutationBusy || (futurePeriod && !r.paid)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition ${r.paid ? 'bg-matcha-glaze/15 text-matcha-glaze' : 'bg-espresso/8 text-espresso/50'}`}
                  >
                    {r.paid ? <CircleCheck className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                    {r.paid ? 'Paid' : 'Not paid'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

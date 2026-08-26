import { useState, useMemo } from 'react'
import { Users, Eye, EyeOff } from 'lucide-react'
import { useFinance } from '@/features/finance/hooks'
import { useWorkers } from '@/features/workers/hooks'
import { PageHeader } from '@/components/shared'
import { MonthFilterBar } from '../components/MonthFilterBar'
import { RoleBadge } from '@/features/workers/components/RoleBadge'

export default function Salary() {
  const { getSalaryForMonth } = useFinance()
  const { data: workers = [] } = useWorkers()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [showLeft, setShowLeft] = useState(false)

  const filteredWorkers = useMemo(() => {
    if (showLeft) return workers
    return workers.filter((w) => w.status === 'active')
  }, [workers, showLeft])

  const rows = useMemo(() => {
    return filteredWorkers.map((w) => {
      const salary = getSalaryForMonth(w.id, year, month)
      return { worker: w, ...salary }
    })
  }, [filteredWorkers, getSalaryForMonth, year, month])

  const totalSalary = rows.reduce((s, r) => s + r.total, 0)

  return (
    <div>
      <PageHeader
        eyebrow="Finance / Salary"
        title="Salary"
        description="Prorated worker pay based on attendance and overtime."
        actions={
          <button
            onClick={() => setShowLeft((s) => !s)}
            className="inline-flex items-center gap-2 rounded-lg border border-espresso/15 bg-proof-cream px-3 py-2 text-sm font-medium text-espresso/70 hover:bg-sourdough/40"
          >
            {showLeft ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showLeft ? 'Hide left workers' : 'Show left workers'}
          </button>
        }
      />

      <MonthFilterBar year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m) }} />

      {/* Total */}
      <div className="mb-4 rounded-bakery border border-espresso/8 bg-proof-cream p-4 shadow-bakery">
        <p className="font-mono text-[10px] uppercase tracking-wider text-espresso/50">Total Salary Outflow</p>
        <p className="mt-1 font-mono text-2xl font-bold text-espresso">₹{totalSalary.toLocaleString('en-IN')}</p>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-bakery border-2 border-dashed border-espresso/15 px-6 py-12 text-center">
          <Users className="mb-3 h-12 w-12 text-espresso/30" />
          <p className="font-display text-lg text-espresso/60">No workers to show</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-bakery border border-espresso/8 bg-proof-cream shadow-bakery lg:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-espresso/10 bg-crust/30 text-left">
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Worker</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Roles</th>
                  <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-espresso/50">Monthly Salary</th>
                  <th className="px-4 py-3 text-center font-mono text-[10px] uppercase tracking-wider text-espresso/50">Present</th>
                  <th className="px-4 py-3 text-center font-mono text-[10px] uppercase tracking-wider text-espresso/50">Half-day</th>
                  <th className="px-4 py-3 text-center font-mono text-[10px] uppercase tracking-wider text-espresso/50">Absent</th>
                  <th className="px-4 py-3 text-center font-mono text-[10px] uppercase tracking-wider text-espresso/50">OT hrs</th>
                  <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-espresso/50">Prorated Pay</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.worker.id} className="border-b border-espresso/8 last:border-0 hover:bg-crust/20">
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
                    <td className="px-4 py-3 text-center font-mono text-cherry-compote">{r.absent}</td>
                    <td className="px-4 py-3 text-center font-mono text-espresso/60">{r.overtime}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-espresso">₹{r.total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-espresso/15 bg-crust/30">
                  <td colSpan={7} className="px-4 py-3 text-right font-mono text-xs uppercase tracking-wider text-espresso/50">Total</td>
                  <td className="px-4 py-3 text-right font-mono text-lg font-bold text-espresso">₹{totalSalary.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="flex flex-col gap-3 lg:hidden">
            {rows.map((r) => (
              <div key={r.worker.id} className="rounded-bakery border border-espresso/8 bg-proof-cream p-4 shadow-bakery">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-espresso">{r.worker.name}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {r.worker.roles.map((role) => <RoleBadge key={role} role={role} />)}
                    </div>
                  </div>
                  <p className="font-mono text-lg font-bold text-espresso">₹{r.total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                  <div><p className="font-mono text-[10px] uppercase text-espresso/40">Present</p><p className="font-mono text-sm font-bold text-matcha-glaze">{r.present}</p></div>
                  <div><p className="font-mono text-[10px] uppercase text-espresso/40">Half-day</p><p className="font-mono text-sm font-bold text-toasted-sesame">{r.half}</p></div>
                  <div><p className="font-mono text-[10px] uppercase text-espresso/40">Absent</p><p className="font-mono text-sm font-bold text-cherry-compote">{r.absent}</p></div>
                  <div><p className="font-mono text-[10px] uppercase text-espresso/40">OT hrs</p><p className="font-mono text-sm font-bold text-espresso/60">{r.overtime}</p></div>
                </div>
                <p className="mt-2 text-xs text-espresso/40">Monthly salary: ₹{r.worker.monthlySalary.toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

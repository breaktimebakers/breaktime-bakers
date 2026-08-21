import { useState, useMemo } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { useFinance } from '@/features/finance/hooks'
import { PageHeader } from '@/components/shared'
import { MonthFilterBar } from '../components/MonthFilterBar'

function MiniBar({ label, value, isPositive }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className={`h-2 w-2 rounded-full ${isPositive ? 'bg-matcha-glaze' : 'bg-cherry-compote'}`} />
      <div className="flex-1">
        <span className="text-sm text-espresso/70">{label}</span>
      </div>
      <span className={`font-mono text-sm font-semibold ${isPositive ? 'text-matcha-glaze' : 'text-cherry-compote'}`}>
        {isPositive ? '+' : ''}₹{Math.abs(value).toLocaleString('en-IN')}
      </span>
    </div>
  )
}

export default function ProfitAndLoss() {
  const { getProfitAndLoss } = useFinance()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const pnl = useMemo(() => getProfitAndLoss(year, month), [getProfitAndLoss, year, month])
  const isProfit = pnl.profit >= 0

  // Bar chart for purchased vs used
  const maxBar = Math.max(pnl.rawMaterialsPurchased, pnl.rawMaterialsUsed, 1)

  return (
    <div>
      <PageHeader eyebrow="Finance / Profit & Loss" title="Profit & Loss" description="Monthly P&L statement with full breakdown." />

      <MonthFilterBar year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m) }} />

      {/* Large profit figure */}
      <div className={`mb-4 rounded-bakery border p-6 shadow-bakery ${isProfit ? 'border-matcha-glaze/30 bg-matcha-glaze/5' : 'border-cherry-compote/30 bg-cherry-compote/5'}`}>
        <div className="flex items-center gap-3">
          {isProfit ? <TrendingUp className="h-8 w-8 text-matcha-glaze" /> : <TrendingDown className="h-8 w-8 text-cherry-compote" />}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-espresso/50">Net Profit</p>
            <p className={`mt-1 font-mono text-4xl font-bold ${isProfit ? 'text-matcha-glaze' : 'text-cherry-compote'}`}>
              {isProfit ? '+' : ''}₹{pnl.profit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
        <p className="mt-3 font-mono text-xs text-espresso/40">
          Sales − Raw Materials − Salaries − Expenses − Taxes = Profit
        </p>
      </div>

      {/* Breakdown table */}
      <div className="mb-4 overflow-hidden rounded-bakery border border-espresso/8 bg-proof-cream shadow-bakery">
        <div className="border-b border-espresso/10 bg-crust/30 px-5 py-3">
          <h3 className="font-display text-lg font-semibold text-espresso">Breakdown</h3>
        </div>
        <div className="divide-y divide-espresso/8">
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-sm text-espresso/70">Sales (Customer Payments)</span>
            <span className="font-mono font-semibold text-matcha-glaze">+₹{pnl.sales.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-sm text-espresso/70">Raw Materials Purchased</span>
            <span className="font-mono font-semibold text-cherry-compote">−₹{pnl.rawMaterialsPurchased.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex items-center justify-between px-5 py-3 bg-espresso/5">
            <div>
              <span className="text-sm text-espresso/50">Raw Materials Used</span>
              <span className="ml-2 rounded-full bg-espresso/8 px-2 py-0.5 text-[10px] text-espresso/40">reference only</span>
            </div>
            <span className="font-mono text-espresso/50">₹{pnl.rawMaterialsUsed.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-sm text-espresso/70">Salaries</span>
            <span className="font-mono font-semibold text-cherry-compote">−₹{pnl.salaries.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-sm text-espresso/70">Expenses</span>
            <span className="font-mono font-semibold text-cherry-compote">−₹{pnl.expenses.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-sm text-espresso/70">Taxes</span>
            <span className="font-mono font-semibold text-cherry-compote">−₹{pnl.taxes.toLocaleString('en-IN')}</span>
          </div>
          <div className={`flex items-center justify-between border-t-2 border-espresso/15 px-5 py-4 ${isProfit ? 'bg-matcha-glaze/5' : 'bg-cherry-compote/5'}`}>
            <span className="font-display text-lg font-semibold text-espresso">Net Profit</span>
            <span className={`font-mono text-2xl font-bold ${isProfit ? 'text-matcha-glaze' : 'text-cherry-compote'}`}>
              {isProfit ? '+' : ''}₹{pnl.profit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      </div>

      {/* Purchased vs Used bar chart */}
      <div className="rounded-bakery border border-espresso/8 bg-proof-cream p-5 shadow-bakery">
        <h3 className="mb-4 font-display text-lg font-semibold text-espresso">Raw Materials: Purchased vs Used</h3>
        <div className="flex items-end gap-8" style={{ height: 180 }}>
          <div className="flex flex-1 flex-col items-center gap-2">
            <span className="font-mono text-sm font-semibold text-espresso">₹{pnl.rawMaterialsPurchased.toLocaleString('en-IN')}</span>
            <div className="flex w-full flex-1 items-end justify-center">
              <div
                className="w-full max-w-[60px] rounded-t-md bg-cherry-compote/60 transition-all hover:opacity-80"
                style={{ height: Math.max((pnl.rawMaterialsPurchased / maxBar) * 130, 4) }}
              />
            </div>
            <span className="font-mono text-[10px] uppercase text-espresso/40">Purchased</span>
          </div>
          <div className="flex flex-1 flex-col items-center gap-2">
            <span className="font-mono text-sm font-semibold text-espresso/70">₹{pnl.rawMaterialsUsed.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            <div className="flex w-full flex-1 items-end justify-center">
              <div
                className="w-full max-w-[60px] rounded-t-md bg-oven-amber/60 transition-all hover:opacity-80"
                style={{ height: Math.max((pnl.rawMaterialsUsed / maxBar) * 130, 4) }}
              />
            </div>
            <span className="font-mono text-[10px] uppercase text-espresso/40">Used</span>
          </div>
        </div>
      </div>
    </div>
  )
}

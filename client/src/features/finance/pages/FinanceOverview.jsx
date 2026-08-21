import { Link } from '@tanstack/react-router'
import { Wallet, Receipt, Truck, HandCoins, Landmark, TrendingUp, ArrowRight, Users, CircleDollarSign } from 'lucide-react'
import { useFinance } from '@/features/finance/hooks'
import { PageHeader, StatCard } from '@/components/shared'

function NavCard({ to, icon: Icon, title, description, linkLabel }) {
  return (
    <Link to={to} className="group flex flex-col rounded-bakery border border-espresso/8 bg-proof-cream p-6 shadow-bakery transition-all hover:-translate-y-0.5 hover:shadow-bakery-lg">
      <div className="flex h-12 w-12 items-center justify-center rounded-bakery bg-oven-amber/15 text-oven-amber">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 font-display text-xl font-semibold text-espresso">{title}</h3>
      <p className="mt-1 flex-1 text-sm text-espresso/55">{description}</p>
      <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-oven-amber">
        {linkLabel}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  )
}

function ProfitTrendChart({ data }) {
  const max = Math.max(...data.map((d) => Math.abs(d.profit)), 1)
  const min = Math.min(...data.map((d) => d.profit), 0)
  const range = max - min || 1
  const chartHeight = 160

  return (
    <div className="rounded-bakery border border-espresso/8 bg-proof-cream p-5 shadow-bakery">
      <h3 className="mb-4 font-display text-lg font-semibold text-espresso">Profit Trend</h3>
      <div className="flex items-end gap-2" style={{ height: chartHeight }}>
        {data.map((d, i) => {
          const isPositive = d.profit >= 0
          const barHeight = Math.max((Math.abs(d.profit) / max) * (chartHeight - 30), 4)
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="font-mono text-[10px] text-espresso/50">
                {(d.profit / 1000).toFixed(0)}k
              </span>
              <div className="flex w-full flex-1 items-end justify-center">
                <div
                  className={`w-full max-w-[36px] rounded-t-md transition-all hover:opacity-80 ${isPositive ? 'bg-matcha-glaze' : 'bg-cherry-compote'}`}
                  style={{ height: barHeight }}
                  title={`₹${d.profit.toLocaleString('en-IN')}`}
                />
              </div>
              <span className="font-mono text-[9px] uppercase text-espresso/40">{d.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function FinanceOverview() {
  const { getProfitAndLoss, outstandingSupplier, outstandingCustomer } = useFinance()
  const now = new Date()
  const pnl = getProfitAndLoss(now.getFullYear(), now.getMonth())
  const totalOutstanding = outstandingSupplier + outstandingCustomer

  // Last 6 months profit trend
  const trendData = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthPnl = getProfitAndLoss(d.getFullYear(), d.getMonth())
    trendData.push({
      label: d.toLocaleDateString('en-IN', { month: 'short' }),
      profit: monthPnl.profit,
    })
  }

  return (
    <div>
      <PageHeader eyebrow="Finance / Overview" title="Finance" description="Track revenue, expenses, salaries, and profitability." />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="This Month's Revenue" value={`₹${pnl.sales.toLocaleString('en-IN')}`} icon={CircleDollarSign} chipColor="bg-matcha-glaze/15 text-matcha-glaze" />
        <StatCard label="This Month's Expenses" value={`₹${pnl.expenses.toLocaleString('en-IN')}`} icon={Receipt} chipColor="bg-cherry-compote/15 text-cherry-compote" />
        <StatCard label="This Month's Salaries" value={`₹${pnl.salaries.toLocaleString('en-IN')}`} icon={Users} chipColor="bg-oven-amber/15 text-oven-amber" />
        <StatCard label="Outstanding" value={`₹${totalOutstanding.toLocaleString('en-IN')}`} icon={Wallet} chipColor="bg-cherry-compote/15 text-cherry-compote" danger={totalOutstanding > 0} />
      </div>

      {/* Outstanding breakdown */}
      <div className="mt-2 flex items-center gap-4 text-xs text-espresso/50">
        <span>Supplier: ₹{outstandingSupplier.toLocaleString('en-IN')}</span>
        <span className="text-espresso/20">|</span>
        <span>Customer: ₹{outstandingCustomer.toLocaleString('en-IN')}</span>
      </div>

      {/* Profit figure */}
      <div className="mt-4 rounded-bakery border border-espresso/8 bg-proof-cream p-5 shadow-bakery">
        <p className="font-mono text-[10px] uppercase tracking-wider text-espresso/50">Net Profit (This Month)</p>
        <p className={`mt-1 font-mono text-3xl font-bold ${pnl.profit >= 0 ? 'text-matcha-glaze' : 'text-cherry-compote'}`}>
          ₹{pnl.profit.toLocaleString('en-IN')}
        </p>
      </div>

      {/* Profit trend chart */}
      <div className="mt-6">
        <ProfitTrendChart data={trendData} />
      </div>

      {/* Nav cards */}
      <div className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        <NavCard to="/finance/salary" icon={Users} title="Salary" description="Calculate worker salaries based on attendance and overtime." linkLabel="View" />
        <NavCard to="/finance/expenses" icon={Receipt} title="Expenses" description="Track and categorize all business expenses." linkLabel="Manage" />
        <NavCard to="/finance/supplier-payments" icon={Truck} title="Supplier Payments" description="Track payments to raw material suppliers." linkLabel="View" />
        <NavCard to="/finance/customer-payments" icon={HandCoins} title="Customer Payments" description="Track payments from stores and retail buyers." linkLabel="View" />
        <NavCard to="/finance/taxes" icon={Landmark} title="Taxes" description="Record tax payments like GST." linkLabel="Manage" />
        <NavCard to="/finance/profit-loss" icon={TrendingUp} title="Profit & Loss" description="Monthly P&L statement with full breakdown." linkLabel="View" />
      </div>
    </div>
  )
}

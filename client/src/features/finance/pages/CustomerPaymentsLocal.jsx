import { Link } from '@tanstack/react-router'
import { ShoppingBag, Wallet, Check } from 'lucide-react'
import { useWalkInSales } from '@/features/sales/hooks'
import { WalkInSaleRow } from '@/features/sales/components/WalkInSaleRow'
import { EmptyState, ErrorState, PageHeader, StatCard } from '@/components/shared'

// Read-only: walk-in sales are recorded from the counter in Sales
// (WalkInSales.jsx) - this page just surfaces that same data for Finance,
// no separate add/settle flow here. Settling a partial sale still happens
// from the Sales side.
export default function CustomerPaymentsLocal() {
  const { data: sales = [], isLoading, isError, error, refetch } = useWalkInSales()

  const outstanding = sales.filter((s) => s.paymentStatus === 'partial').reduce((sum, s) => sum + Number(s.amount), 0)
  const paid = sales.filter((s) => s.paymentStatus === 'paid').reduce((sum, s) => sum + Number(s.amount), 0)

  return (
    <div>
      <div className="mb-4 flex items-center gap-1.5 text-sm text-espresso/50">
        <Link to="/finance/customer-payments" className="hover:text-oven-amber">Customer Payments</Link>
        <span>/</span>
        <span className="text-espresso">Local / Walk-in</span>
      </div>

      <PageHeader eyebrow="Finance / Customer Payments" title="Local / Walk-in" description="Counter sales to walk-in customers, recorded in Sales." />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-4">
        <StatCard label="Outstanding" value={`₹${outstanding.toLocaleString('en-IN')}`} icon={Wallet} chipColor="bg-cherry-compote/15 text-cherry-compote" danger={outstanding > 0} />
        <StatCard label="Paid" value={`₹${paid.toLocaleString('en-IN')}`} icon={Check} chipColor="bg-matcha-glaze/15 text-matcha-glaze" />
      </div>

      {isError ? (
        <ErrorState description={error?.message} onRetry={refetch} />
      ) : isLoading ? (
        <p role="status" className="text-sm text-espresso/50">Loading walk-in sales…</p>
      ) : sales.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="No walk-in sales" description="Counter sales recorded in Sales will show up here." />
      ) : (
        <div className="flex flex-col gap-2">
          {sales.map((s) => <WalkInSaleRow key={s.id} sale={s} />)}
        </div>
      )}
    </div>
  )
}

import { Link } from '@tanstack/react-router'
import { Check, HandCoins, MapPin, ShoppingBag, ArrowRight } from 'lucide-react'
import { useAreaPaymentSummaries, useCustomerPaymentsOverview } from '@/features/finance/hooks'
import { useWalkInSales } from '@/features/sales/hooks'
import { ErrorState, PageHeader, StatCard } from '@/components/shared'

export default function CustomerPayments() {
  const { data: areas = [], isLoading, isError, error, refetch } = useAreaPaymentSummaries()
  const { data: overview } = useCustomerPaymentsOverview()
  const { data: walkInSales = [] } = useWalkInSales()

  const outstanding = overview?.outstanding || 0
  const paid = overview?.paid || 0
  const walkInOutstanding = walkInSales.filter((s) => s.paymentStatus === 'partial').reduce((sum, s) => sum + Number(s.amount), 0)
  const walkInPaid = walkInSales.filter((s) => s.paymentStatus === 'paid').reduce((sum, s) => sum + Number(s.amount), 0)

  return (
    <div>
      <PageHeader eyebrow="Finance / Customer Payments" title="Customer Payments" description="Track payments from stores and retail buyers across areas." />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-4">
        <StatCard label="Outstanding" value={`₹${outstanding.toLocaleString('en-IN')}`} icon={HandCoins} chipColor="bg-cherry-compote/15 text-cherry-compote" danger={outstanding > 0} />
        <StatCard label="Paid" value={`₹${paid.toLocaleString('en-IN')}`} icon={Check} chipColor="bg-matcha-glaze/15 text-matcha-glaze" />
      </div>

      {/* Area cards */}
      <h2 className="mb-3 font-display text-lg font-semibold text-espresso">Areas</h2>
      {isError ? (
        <ErrorState description={error?.message} onRetry={refetch} />
      ) : isLoading ? (
        <p role="status" className="text-sm text-espresso/50">Loading area summaries…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((a) => (
            <Link key={a.areaId} to="/finance/customer-payments/$areaId" params={{ areaId: a.areaId }}
              className="group rounded-bakery border border-espresso/8 bg-proof-cream p-5 shadow-bakery transition-all hover:-translate-y-0.5 hover:shadow-bakery-lg">
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-bakery bg-oven-amber/15 text-oven-amber">
                  <MapPin className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-espresso/30 transition-transform group-hover:translate-x-1" />
              </div>
              <h3 className="mt-3 font-display text-lg font-semibold text-espresso">{a.areaName}</h3>
              <p className="text-xs text-espresso/50">{a.storeCount} {a.storeCount === 1 ? 'store' : 'stores'}</p>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-espresso/50">Outstanding: <span className="font-mono font-medium text-cherry-compote">₹{a.outstanding.toLocaleString('en-IN')}</span></span>
                <span className="text-espresso/50">Paid: <span className="font-mono font-medium text-matcha-glaze">₹{a.paid.toLocaleString('en-IN')}</span></span>
              </div>
            </Link>
          ))}

          {/* Local / Walk-in card - links straight to the counter (Sales'
              Walk-in Sales page), where these sales are actually recorded
              and settled, rather than to a read-only Finance mirror. */}
          <Link to="/sales/walk-in"
            className="group rounded-bakery border border-dashed border-espresso/15 bg-crust/20 p-5 shadow-bakery transition-all hover:-translate-y-0.5 hover:shadow-bakery-lg">
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-bakery bg-espresso/8 text-espresso/50">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-espresso/30 transition-transform group-hover:translate-x-1" />
            </div>
            <h3 className="mt-3 font-display text-lg font-semibold text-espresso/70">Local / Walk-in</h3>
            <p className="text-xs text-espresso/40">Counter sales, recorded in Sales</p>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-espresso/50">Outstanding: <span className="font-mono font-medium text-cherry-compote">₹{walkInOutstanding.toLocaleString('en-IN')}</span></span>
              <span className="text-espresso/50">Paid: <span className="font-mono font-medium text-matcha-glaze">₹{walkInPaid.toLocaleString('en-IN')}</span></span>
            </div>
          </Link>
        </div>
      )}
    </div>
  )
}

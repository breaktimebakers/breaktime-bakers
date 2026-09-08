import { Link } from '@tanstack/react-router'
import { MapPin, ClipboardList, Store, ArrowRight, Receipt, Package, ShoppingBag } from 'lucide-react'
import { useSalesOverview } from '@/features/sales/hooks'
import { Button, PageHeader } from '@/components/shared'

function StatCard({ label, value, icon: Icon, chipColor, danger }) {
  return (
    <div className={`rounded-bakery border bg-proof-cream p-4 shadow-bakery transition-all hover:-translate-y-0.5 hover:shadow-bakery-lg sm:p-5 ${danger ? 'border-cherry-compote/30' : 'border-espresso/8'}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-espresso/50">{label}</p>
          <p className={`mt-1.5 font-mono text-2xl font-bold sm:text-3xl ${danger ? 'text-cherry-compote' : 'text-espresso'}`}>{value}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-bakery ${chipColor}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

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

export default function SalesOverview() {
  const { data: overview, isLoading, isError, isFetching, refetch } = useSalesOverview()
  const pending = overview?.ordersPending

  return (
    <div>
      <PageHeader eyebrow="Sales / Overview" title="Sales" description="Manage sales territories, store orders, and field order takers." />

      {isError && (
        <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-bakery border border-cherry-compote/30 bg-proof-cream p-4 text-sm text-cherry-compote">
          <p>{overview ? 'Could not refresh sales totals. Showing the last loaded values.' : 'Could not load sales totals. Please try again.'}</p>
          <Button size="sm" variant="secondary" onClick={() => refetch()} disabled={isFetching}>{isFetching ? 'Retrying…' : 'Retry'}</Button>
        </div>
      )}
      {isLoading && <p role="status" className="mb-3 text-sm text-espresso/50">Loading sales totals…</p>}
      <div aria-busy={isFetching} className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Total areas" value={overview?.totalAreas ?? '—'} icon={MapPin} chipColor="bg-sourdough/50 text-espresso" />
        <StatCard label="Total stores" value={overview?.totalStores ?? '—'} icon={Store} chipColor="bg-olive-herb/30 text-olive-herb" />
        <StatCard label="Orders today" value={overview?.ordersToday ?? '—'} icon={Receipt} chipColor="bg-oven-amber/15 text-oven-amber" />
        <StatCard label="Orders pending" value={pending ?? '—'} icon={Package} chipColor={pending > 0 ? 'bg-cherry-compote/15 text-cherry-compote' : 'bg-matcha-glaze/20 text-matcha-glaze'} danger={pending > 0} />
      </div>

      <div className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2 sm:gap-6">
        <NavCard to="/sales/areas" icon={MapPin} title="Areas & Stores" description="Manage sales territories and the stores within each area." linkLabel="Manage" />
        <NavCard to="/sales/orders" icon={ClipboardList} title="Orders" description="View, filter, and fulfill store orders from your field team." linkLabel="View" />
        <NavCard to="/sales/walk-in" icon={ShoppingBag} title="Walk-in Sales" description="Record instant counter sales to walk-in customers." linkLabel="Record" />
      </div>
    </div>
  )
}

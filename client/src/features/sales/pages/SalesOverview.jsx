import { Link } from '@tanstack/react-router'
import { MapPin, ClipboardList, Store, ArrowRight, Receipt, Package } from 'lucide-react'
import { useSales } from '@/features/sales/hooks'
import { PageHeader } from '@/components/shared'

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
  const { areas, stores, orders } = useSales()
  const today = new Date().toISOString().slice(0, 10)
  const ordersToday = orders.filter((o) => o.date === today).length
  const pending = orders.filter((o) => o.status !== 'delivered').length

  return (
    <div>
      <PageHeader eyebrow="Sales / Overview" title="Sales" description="Manage sales territories, store orders, and field order takers." />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Total areas" value={areas.length} icon={MapPin} chipColor="bg-sourdough/50 text-espresso" />
        <StatCard label="Total stores" value={stores.length} icon={Store} chipColor="bg-olive-herb/30 text-olive-herb" />
        <StatCard label="Orders today" value={ordersToday} icon={Receipt} chipColor="bg-oven-amber/15 text-oven-amber" />
        <StatCard label="Orders pending" value={pending} icon={Package} chipColor={pending > 0 ? 'bg-cherry-compote/15 text-cherry-compote' : 'bg-matcha-glaze/20 text-matcha-glaze'} danger={pending > 0} />
      </div>

      <div className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2 sm:gap-6">
        <NavCard to="/sales/areas" icon={MapPin} title="Areas & Stores" description="Manage sales territories and the stores within each area." linkLabel="Manage" />
        <NavCard to="/sales/orders" icon={ClipboardList} title="Orders" description="View, filter, and fulfill store orders from your field team." linkLabel="View" />
      </div>
    </div>
  )
}

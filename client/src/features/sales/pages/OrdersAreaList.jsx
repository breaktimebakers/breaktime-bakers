import { useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { MapPin, ArrowRight, ClipboardList } from 'lucide-react'
import { useSales } from '@/features/sales/hooks'
import { EmptyState, PageHeader } from '@/components/shared'

function StatCard({ label, value, icon: Icon, chipColor }) {
  return (
    <div className="rounded-bakery border border-espresso/8 bg-proof-cream p-5 shadow-bakery">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-bakery ${chipColor}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-espresso/50">{label}</p>
          <p className="font-display text-2xl font-bold text-espresso">{value}</p>
        </div>
      </div>
    </div>
  )
}

export default function OrdersAreaList() {
  const { orders, areas, stores } = useSales()
  const todayStr = new Date().toISOString().slice(0, 10)

  const todaysOrders = useMemo(() => orders.filter((o) => o.date === todayStr), [orders, todayStr])

  const areaStats = useMemo(() => {
    return areas.map((a) => {
      const areaStoreIds = new Set(stores.filter((s) => s.areaId === a.id).map((s) => s.id))
      const areaOrders = orders.filter((o) => areaStoreIds.has(o.storeId))
      const todayCount = areaOrders.filter((o) => o.date === todayStr).length
      const pendingCount = areaOrders.filter((o) => o.status !== 'delivered').length
      return { area: a, todayCount, pendingCount }
    })
  }, [areas, stores, orders, todayStr])

  return (
    <div>
      <PageHeader eyebrow="Sales / Orders" title="Orders" description="View and fulfill store orders across all areas." />

      <div className="mb-5">
        <StatCard
          label="Total orders today"
          value={todaysOrders.length}
          icon={ClipboardList}
          chipColor="bg-oven-amber/15 text-oven-amber"
        />
      </div>

      <h2 className="mb-3 font-display text-lg font-semibold text-espresso">Areas</h2>
      {areaStats.length === 0 ? (
        <EmptyState icon={MapPin} title="No areas" description="Add areas to see order breakdowns." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {areaStats.map(({ area, todayCount, pendingCount }) => (
            <Link
              key={area.id}
              to="/sales/orders/$areaId"
              params={{ areaId: area.id }}
              className="group rounded-bakery border border-espresso/8 bg-proof-cream p-5 shadow-bakery transition-all hover:-translate-y-0.5 hover:shadow-bakery-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-bakery bg-oven-amber/15 text-oven-amber">
                  <MapPin className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-espresso/30 transition-transform group-hover:translate-x-1" />
              </div>
              <h3 className="mt-3 font-display text-lg font-semibold text-espresso">{area.name}</h3>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-espresso/50">
                  Today: <span className="font-mono font-medium text-espresso">{todayCount}</span>
                </span>
                <span className="text-espresso/50">
                  Pending: <span className="font-mono font-medium text-cherry-compote">{pendingCount}</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

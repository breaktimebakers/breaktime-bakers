import { useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { MapPin, ArrowRight, ClipboardList } from 'lucide-react'
import { useAreas, useAllStores, useOrders } from '@/features/sales/hooks'
import { EmptyState, ErrorState, PageHeader } from '@/components/shared'
import { todayISO } from '@/utils'

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
  const areasQuery = useAreas()
  const storesQuery = useAllStores()
  // Unscoped by date - "today" and "pending" are both computed here from
  // the same full order history, unlike OrdersOverview's list which
  // defaults to (and mostly stays on) just today's orders.
  const ordersQuery = useOrders({ filter: 'all' })
  const { data: areas = [] } = areasQuery
  const { data: stores = [] } = storesQuery
  const { data: orders = [] } = ordersQuery

  const pageQueries = [areasQuery, storesQuery, ordersQuery]
  const pageLoading = pageQueries.some((q) => q.isLoading)
  const pageError = pageQueries.some((q) => q.isError)
  const pageFetching = pageQueries.some((q) => q.isFetching)
  const retryPage = () => pageQueries.forEach((q) => q.refetch())
  // orderDate is stamped server-side as an Asia/Kolkata calendar date
  // (see server/src/utils/dateRange.js) - comparing against a UTC-based
  // "today" here would disagree with it right around midnight IST.
  const todayStr = todayISO()

  const todaysOrders = useMemo(() => orders.filter((o) => o.orderDate === todayStr), [orders, todayStr])

  const areaStats = useMemo(() => {
    return areas.map((a) => {
      const areaStoreIds = new Set(stores.filter((s) => s.areaId === a.id).map((s) => s.id))
      const areaOrders = orders.filter((o) => areaStoreIds.has(o.storeId))
      const todayCount = areaOrders.filter((o) => o.orderDate === todayStr).length
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
      {pageError ? (
        <ErrorState description="Could not load orders." onRetry={retryPage} retrying={pageFetching} />
      ) : pageLoading ? (
        <p className="px-1 py-8 text-center text-sm text-espresso/40">Loading orders...</p>
      ) : areaStats.length === 0 ? (
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

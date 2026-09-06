import { OrderProductsTable } from '../components/OrderProductsTable'
import { useState, useMemo, Fragment } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, CalendarDays, ChevronDown, ChevronRight, MapPin, Search } from 'lucide-react'
import { useAreas, usePaginatedOrders, useScheduleToday } from '@/features/sales/hooks'
import { useWorkers } from '@/features/workers/hooks'
import { ORDER_STATUS } from '@/constants/orderStatus'
import { Button, EmptyState, ErrorState, PageHeader, Pagination, SortIcon, inputClass } from '@/components/shared'

const PAGE_SIZE = 10

export default function OrderTakersList() {
  const workersQuery = useWorkers()
  const areasQuery = useAreas()
  const scheduleQuery = useScheduleToday()
  const { data: workers = [] } = workersQuery
  const { data: areas = [] } = areasQuery
  const { data: todaySchedule } = scheduleQuery
  const orderTakers = useMemo(() => workers.filter((w) => w.roles.includes('marketer')), [workers])

  // These three feed the cards section only - the table below has its own
  // independent isLoading/isError via usePaginatedOrders.
  const cardQueries = [workersQuery, areasQuery, scheduleQuery]
  const cardsLoading = cardQueries.some((q) => q.isLoading)
  const cardsError = cardQueries.some((q) => q.isError)
  const cardsFetching = cardQueries.some((q) => q.isFetching)
  const retryCards = () => cardQueries.forEach((q) => q.refetch())
  const todayAreaByWorker = useMemo(
    () => Object.fromEntries((todaySchedule?.assignments || []).map((a) => [a.workerId, a.areaId])),
    [todaySchedule],
  )

  // Table filter state
  const [otFilter, setOtFilter] = useState('all')
  const [dateMode, setDateMode] = useState('today')
  const [specificDate, setSpecificDate] = useState('')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState('orderDate')
  const [sortDir, setSortDir] = useState('desc')
  const [expandedIds, setExpandedIds] = useState(() => new Set())

  const toggleExpanded = (id) => setExpandedIds((prev) => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const paginationResetKey = JSON.stringify([otFilter, dateMode, specificDate, customFrom, customTo, statusFilter, search, sortKey, sortDir])
  const [pageState, setPageState] = useState({ key: paginationResetKey, page: 1 })
  const requestedPage = pageState.key === paginationResetKey ? pageState.page : 1
  if (pageState.key !== paginationResetKey) setPageState({ key: paginationResetKey, page: 1 })
  const setPage = (nextPage) => setPageState({ key: paginationResetKey, page: nextPage })
  const { data, isLoading, isError } = usePaginatedOrders({
    page: requestedPage,
    pageSize: PAGE_SIZE,
    filter: dateMode === 'specific' ? 'custom' : dateMode,
    from: dateMode === 'specific' ? specificDate || undefined : dateMode === 'custom' ? customFrom || undefined : undefined,
    to: dateMode === 'specific' ? specificDate || undefined : dateMode === 'custom' ? customTo || undefined : undefined,
    orderTakerId: otFilter === 'all' ? undefined : otFilter,
    status: statusFilter,
    search: search.trim() || undefined,
    sortKey,
    sortDir,
  })
  const pagedOrders = data?.orders || []
  const { page = requestedPage, totalPages = 1, totalItems = 0 } = data?.pagination || {}

  const clearFilters = () => {
    setOtFilter('all'); setDateMode('today'); setSpecificDate(''); setCustomFrom(''); setCustomTo(''); setStatusFilter('all'); setSearch('')
  }
  const anyFilter = otFilter !== 'all' || dateMode !== 'today' || statusFilter !== 'all' || search

  const columns = [
    { key: 'otName', label: 'Order taker' },
    { key: 'storeName', label: 'Store' },
    { key: 'areaName', label: 'Area' },
    { key: 'productsLabel', label: 'Products' },
    { key: 'totalQty', label: 'Qty' },
    { key: 'status', label: 'Status' },
    { key: 'orderDate', label: 'Date' },
  ]

  return (
    <div>
      <Link to="/sales/orders" className="mb-3 inline-flex items-center gap-1.5 text-sm text-espresso/50 hover:text-oven-amber">
        <ArrowLeft className="h-4 w-4" /> Back to orders
      </Link>
      <PageHeader
        eyebrow="Sales / Order takers"
        title="Order Takers"
        description="Field sales reps, the area each of them is covering today, and a full breakdown of their orders."
        actions={
          <Link to="/sales/orders/order-takers/schedule" className="inline-flex items-center gap-1.5 rounded-bakery border border-espresso/15 bg-proof-cream px-3 py-1.5 text-xs font-medium text-espresso transition hover:bg-sourdough/40">
            <CalendarDays className="h-4 w-4" />Daily assignments
          </Link>
        }
      />

      {/* Cards */}
      {cardsError ? (
        <ErrorState description="Could not load order takers." onRetry={retryCards} retrying={cardsFetching} />
      ) : cardsLoading ? (
        <p role="status" className="px-1 py-8 text-center text-sm text-espresso/40">Loading order takers…</p>
      ) : orderTakers.length === 0 ? (
        <EmptyState icon={Search} title="No order takers yet" description="Give a worker the marketer role to see them here." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {orderTakers.map((ot) => {
            const count = data ? data.orderTakerCounts?.find((entry) => entry.orderTakerId === ot.id)?.total || 0 : undefined
            const todayAreaId = todayAreaByWorker[ot.id]
            const todayArea = areas.find((a) => a.id === todayAreaId)
            return (
              <div key={ot.id} className="rounded-bakery border border-espresso/8 bg-proof-cream p-5 shadow-bakery">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-oven-amber/15 font-mono text-sm font-semibold text-oven-amber">
                    {ot.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-lg font-semibold text-espresso">{ot.name}</h3>
                    <p className="text-xs text-espresso/50">{count === undefined ? '—' : count} total {count === 1 ? 'order' : 'orders'}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {todayArea ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-espresso/5 px-2.5 py-1 text-xs text-espresso/70"><MapPin className="h-3 w-3" />Today: {todayArea.name}</span>
                  ) : (
                    <span className="text-xs text-espresso/40">Not scheduled today</span>
                  )}
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Link to="/sales/orders/order-takers/$personId" params={{ personId: ot.id }}>
                    <Button size="sm" variant="secondary">View detail</Button>
                  </Link>
                  <Link to="/sales/orders/order-takers/schedule">
                    <Button size="sm" variant="ghost">Assign area</Button>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Orders table */}
      <div className="mt-8">
        <h2 className="mb-3 font-display text-xl font-semibold text-espresso">All orders by order taker</h2>

        {/* Filter bar */}
        <div className="mb-4 flex flex-col gap-3 rounded-bakery border border-espresso/8 bg-proof-cream p-4 shadow-bakery">
          <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
            <div className="relative flex-1 lg:min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-espresso/30" />
              <input className={`${inputClass} pl-9`} placeholder="Search store, product, person..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className={`${inputClass} lg:w-44`} value={otFilter} onChange={(e) => setOtFilter(e.target.value)}>
              <option value="all">All order takers</option>
              {orderTakers.map((ot) => <option key={ot.id} value={ot.id}>{ot.name}</option>)}
            </select>
            <select className={`${inputClass} lg:w-36`} value={dateMode} onChange={(e) => setDateMode(e.target.value)}>
              <option value="all">All dates</option>
              <option value="today">Today</option>
              <option value="week">This week</option>
              <option value="specific">Specific date</option>
              <option value="custom">Custom range</option>
            </select>
            {dateMode === 'specific' && <input type="date" className={`${inputClass} lg:w-36`} value={specificDate} onChange={(e) => setSpecificDate(e.target.value)} />}
            {dateMode === 'custom' && <>
              <input type="date" className={`${inputClass} lg:w-36`} value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
              <input type="date" className={`${inputClass} lg:w-36`} value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
            </>}
            <div className="inline-flex rounded-full bg-crust p-0.5">
              {['all', 'undelivered', 'delivered'].map((s) => (
                <button key={s} onClick={() => setStatusFilter(s)} className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition ${statusFilter === s ? 'bg-espresso text-crust' : 'text-espresso/60'}`}>{s}</button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs text-espresso/50">{totalItems} {totalItems === 1 ? 'order' : 'orders'}</p>
            {anyFilter && <button onClick={clearFilters} className="text-xs text-oven-amber hover:underline">Clear filters</button>}
          </div>
        </div>

        {isLoading ? (
          <p className="px-1 py-8 text-center text-sm text-espresso/40">Loading orders...</p>
        ) : isError ? (
          <EmptyState icon={Search} title="Could not load orders" description="Something went wrong fetching orders. Try refreshing." />
        ) : totalItems === 0 ? (
          <EmptyState icon={Search} title="No orders found" description="Try adjusting your filters." />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-hidden rounded-bakery border border-espresso/8 bg-proof-cream shadow-bakery md:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[780px] text-sm">
                  <thead>
                    <tr className="border-b border-espresso/10 bg-crust/30 text-left">
                      <th className="w-8 px-2 py-3"></th>
                      {columns.map((col) => (
                        <th key={col.key} className="px-4 py-3">
                          <button onClick={() => toggleSort(col.key)} className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-espresso/50 hover:text-espresso">
                            {col.label}
                            <SortIcon column={col.key} sortKey={sortKey} sortDir={sortDir} />
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pagedOrders.map((o) => {
                      const sc = ORDER_STATUS[o.status]
                      const items = o.items || []
                      const expandable = items.length > 1
                      const isExpanded = expandable && expandedIds.has(o.id)
                      return (
                        <Fragment key={o.id}>
                          <tr
                            className={`border-b border-espresso/8 last:border-0 hover:bg-crust/20 ${isExpanded ? 'bg-crust/40' : ''} ${expandable ? 'cursor-pointer' : ''}`}
                            onClick={expandable ? () => toggleExpanded(o.id) : undefined}
                          >
                            <td className="px-2 py-3 text-espresso/40">
                              {expandable && (
                                <button
                                  type="button"
                                  aria-label={`${isExpanded ? 'Hide' : 'Show'} products for ${o.storeName}`}
                                  aria-expanded={isExpanded}
                                  aria-controls={isExpanded ? `order-products-desktop-${o.id}` : undefined}
                                  onClick={(event) => { event.stopPropagation(); toggleExpanded(o.id) }}
                                  className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-espresso/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oven-amber"
                                >
                                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                </button>
                              )}
                            </td>
                            <td className="px-4 py-3 font-medium text-espresso">{o.otName}</td>
                            <td className="px-4 py-3 text-espresso/80">{o.storeName}</td>
                            <td className="px-4 py-3 text-espresso/60">{o.areaName}</td>
                            <td className="px-4 py-3 text-espresso/80">{o.productsLabel}</td>
                            <td className="px-4 py-3 font-mono text-espresso">{o.totalQty}</td>
                            <td className="px-4 py-3"><span className={`text-xs font-medium capitalize ${sc.color}`}>{sc.label}</span></td>
                            <td className="px-4 py-3 text-espresso/60">{new Date(o.orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          </tr>
                          {isExpanded && (
                            <tr className="border-b border-espresso/8 last:border-0 bg-crust/20">
                              <td colSpan={columns.length + 1} className="px-4 py-4">
                                <OrderProductsTable order={o} id={`order-products-desktop-${o.id}`} />
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile cards */}
            <div className="grid gap-3 md:hidden">
              {pagedOrders.map((o) => {
                const sc = ORDER_STATUS[o.status]
                const items = o.items || []
                const expandable = items.length > 1
                const isExpanded = expandable && expandedIds.has(o.id)
                return (
                  <div key={o.id} className="rounded-bakery border border-espresso/8 bg-proof-cream p-4 shadow-bakery">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-espresso">{o.storeName}</p>
                        <p className="text-xs text-espresso/50">{o.areaName} · {o.otName}</p>
                      </div>
                      <span className={`text-xs font-medium capitalize ${sc.color}`}>{sc.label}</span>
                    </div>
                    <button
                      type="button"
                      disabled={!expandable}
                      aria-expanded={expandable ? isExpanded : undefined}
                      aria-controls={isExpanded ? `order-products-mobile-${o.id}` : undefined}
                      onClick={() => expandable && toggleExpanded(o.id)}
                      className="mt-2 flex w-full items-center justify-between gap-2 text-xs"
                    >
                      <span className="inline-flex items-center gap-1 text-espresso/70">
                        {expandable && (isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />)}
                        {o.productsLabel}
                      </span>
                      <span className="font-mono text-espresso">{o.totalQty} units</span>
                    </button>
                    {isExpanded && (
                      <div className="my-3">
                        <OrderProductsTable order={o} id={`order-products-mobile-${o.id}`} />
                      </div>
                    )}
                    <div className="mt-1 text-xs text-espresso/45">
                      <span>{new Date(o.orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                )
              })}
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} pageSize={PAGE_SIZE} />
          </>
        )}
      </div>
    </div>
  )
}

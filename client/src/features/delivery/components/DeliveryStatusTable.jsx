import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, CircleDot, Clock3, Filter, MapPin, Search, Truck } from 'lucide-react'
import { EmptyState, ErrorState, Pagination, inputClass } from '@/components/shared'
import { useAreas } from '@/features/sales/hooks'
import { useWorkers } from '@/features/workers/hooks'
import { useDeliveryStatus } from '@/features/delivery/hooks'
import { daysAgoISO, isReversedRange, todayISO } from '@/utils'

const PAGE_SIZE = 6

const DATE_OPTIONS = [
  ['today', 'Today'],
  ['yesterday', 'Yesterday'],
  ['specific', 'Specific date'],
  ['custom', 'Custom range'],
]

const STATUS_OPTIONS = [
  ['all', 'All statuses'],
  ['delivered', 'Delivered'],
  ['partial', 'Partially delivered'],
  ['pending', 'Pending'],
  ['no_orders', 'No orders'],
]

const STATUS_META = {
  delivered: { label: 'Delivered', className: 'bg-matcha-glaze/15 text-matcha-glaze', icon: CheckCircle2 },
  partial: { label: 'Partial', className: 'bg-berry-jam/15 text-berry-jam', icon: Truck },
  pending: { label: 'Pending', className: 'bg-oven-amber/15 text-oven-amber', icon: CircleDot },
  no_orders: { label: 'No orders', className: 'bg-espresso/5 text-espresso/45', icon: Clock3 },
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.pending
  const Icon = meta.icon
  return <span className={'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ' + meta.className}><Icon className="h-3.5 w-3.5" />{meta.label}</span>
}

function formatUpdated(value) {
  if (!value) return '—'
  return new Date(value).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  })
}

export function DeliveryStatusTable() {
  const [search, setSearch] = useState('')
  const [area, setArea] = useState('all')
  const [driver, setDriver] = useState('all')
  const [status, setStatus] = useState('all')
  const [dateMode, setDateMode] = useState('today')
  const [specificDate, setSpecificDate] = useState(todayISO())
  const [fromDate, setFromDate] = useState(daysAgoISO(7))
  const [toDate, setToDate] = useState(todayISO())
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [page, setPage] = useState(1)

  const areasQuery = useAreas()
  const workersQuery = useWorkers()

  const dateRange = useMemo(() => {
    if (dateMode === 'today') return { from: todayISO(), to: todayISO() }
    if (dateMode === 'yesterday') return { from: daysAgoISO(1), to: daysAgoISO(1) }
    if (dateMode === 'specific') return { from: specificDate, to: specificDate }
    return { from: fromDate, to: toDate }
  }, [dateMode, fromDate, specificDate, toDate])

  const invalidDateRange = dateMode === 'custom' && isReversedRange(fromDate, toDate)
  const query = useMemo(() => ({
    page,
    pageSize: PAGE_SIZE,
    from: dateRange.from,
    to: dateRange.to,
    areaId: area === 'all' ? undefined : area,
    driverId: driver === 'all' ? undefined : driver,
    status: status === 'all' ? undefined : status,
    search: search.trim() || undefined,
  }), [area, dateRange, driver, page, search, status])
  const queryEnabled = !invalidDateRange && Boolean(dateRange.from && dateRange.to)
  const statusQuery = useDeliveryStatus(query, { enabled: queryEnabled })

  const areas = areasQuery.data || []
  const drivers = (workersQuery.data || []).filter((worker) => worker.roles?.includes('delivery')).sort((a, b) => a.name.localeCompare(b.name))
  const rows = statusQuery.data?.rows || []
  const pagination = statusQuery.data?.pagination
  const activeFilterCount = [area, driver, status].filter((value) => value !== 'all').length + (search ? 1 : 0) + (dateMode !== 'today' ? 1 : 0)
  const isLoading = statusQuery.isLoading || areasQuery.isLoading || workersQuery.isLoading
  const isError = statusQuery.isError || areasQuery.isError || workersQuery.isError
  const isFetching = statusQuery.isFetching || areasQuery.isFetching || workersQuery.isFetching
  const dateCaption = dateMode === 'today' ? 'Today' : dateMode === 'yesterday' ? 'Yesterday' : dateMode === 'specific' ? specificDate : fromDate + ' to ' + toDate

  useEffect(() => {
    setPage(1)
  }, [area, dateMode, driver, fromDate, search, specificDate, status, toDate])

  useEffect(() => {
    if (pagination?.page && pagination.page !== page) setPage(pagination.page)
  }, [page, pagination?.page])

  const retry = () => {
    statusQuery.refetch()
    areasQuery.refetch()
    workersQuery.refetch()
  }

  const clearFilters = () => {
    setSearch('')
    setArea('all')
    setDriver('all')
    setStatus('all')
    setDateMode('today')
    setSpecificDate(todayISO())
    setFromDate(daysAgoISO(7))
    setToDate(todayISO())
    setFiltersOpen(false)
  }

  return (
    <section className="mt-8 rounded-bakery border border-espresso/8 bg-proof-cream shadow-bakery">
      <div className="border-b border-espresso/8 p-5 sm:p-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-oven-amber">{dateCaption} / Status board</p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-espresso">All delivery status</h2>
            <p className="mt-1 text-sm text-espresso/55">Track every assigned store by area, driver, and delivery progress.</p>
          </div>
          <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-espresso/45 sm:mt-0"><MapPin className="h-3.5 w-3.5" />Live delivery data</div>
        </div>

        <div className="mt-5 grid gap-3 lg:flex lg:flex-nowrap lg:items-end">
          <div className="flex min-w-0 gap-2 lg:contents">
            <label className="relative block min-w-0 flex-1 lg:flex-[1.4]">
              <span className="sr-only">Search delivery status</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-espresso/35" />
              <input className={inputClass + ' pl-9'} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search store, area, driver…" />
            </label>
            <button type="button" onClick={() => setFiltersOpen((open) => !open)} className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-espresso/10 px-3 py-2 text-xs font-medium text-espresso/65 transition hover:bg-crust/40 lg:hidden"><Filter className="h-3.5 w-3.5" />Filters{activeFilterCount > 0 && <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-oven-amber px-1 text-[10px] text-proof-cream">{activeFilterCount}</span>}</button>
          </div>
          <div className={(filtersOpen ? 'grid' : 'hidden') + ' grid-cols-1 gap-3 lg:contents'}>
            <label className="block lg:min-w-0 lg:flex-1"><span className="sr-only">Filter by date range</span><select aria-label="Filter by date range" className={inputClass} value={dateMode} onChange={(event) => setDateMode(event.target.value)}>{DATE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            {dateMode === 'specific' && <label className="block lg:min-w-0 lg:flex-1"><span className="sr-only">Select date</span><input aria-label="Select date" type="date" className={inputClass} value={specificDate} onChange={(event) => setSpecificDate(event.target.value)} /></label>}
            {dateMode === 'custom' && <><label className="block lg:min-w-0 lg:flex-1"><span className="sr-only">From date</span><input aria-label="From date" type="date" className={inputClass} value={fromDate} onChange={(event) => setFromDate(event.target.value)} /></label><label className="block lg:min-w-0 lg:flex-1"><span className="sr-only">To date</span><input aria-label="To date" type="date" className={inputClass} value={toDate} onChange={(event) => setToDate(event.target.value)} /></label></>}
            <label className="block lg:min-w-0 lg:flex-1"><span className="sr-only">Filter by area</span><select aria-label="Filter by area" className={inputClass} value={area} onChange={(event) => setArea(event.target.value)}><option value="all">All areas</option>{areas.map((value) => <option key={value.id} value={value.id}>{value.name}</option>)}</select></label>
            <label className="block lg:min-w-0 lg:flex-1"><span className="sr-only">Filter by driver</span><select aria-label="Filter by driver" className={inputClass} value={driver} onChange={(event) => setDriver(event.target.value)}><option value="all">All drivers</option>{drivers.map((value) => <option key={value.id} value={value.id}>{value.name}</option>)}</select></label>
            <label className="block lg:min-w-0 lg:flex-1"><span className="sr-only">Filter by status</span><select aria-label="Filter by status" className={inputClass} value={status} onChange={(event) => setStatus(event.target.value)}>{STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <button type="button" onClick={clearFilters} disabled={!activeFilterCount} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-espresso/10 px-3 py-2 text-xs font-medium text-espresso/60 transition hover:bg-crust/40 disabled:cursor-not-allowed disabled:opacity-35 lg:shrink-0"><Filter className="h-3.5 w-3.5" />Clear</button>
          </div>
        </div>
        {invalidDateRange && <p className="mt-2 text-xs text-cherry-compote" role="alert">The custom range&apos;s start date must be before its end date.</p>}
      </div>

      {isError ? <div className="p-5"><ErrorState description="Could not load delivery status." onRetry={retry} retrying={isFetching} /></div> : isLoading ? (
        <div role="status" className="space-y-3 p-5 sm:p-6">{[1, 2, 3, 4].map((item) => <div key={item} className="h-12 animate-pulse rounded-lg bg-crust/60" />)}<span className="sr-only">Loading delivery status…</span></div>
      ) : rows.length === 0 ? (
        <div className="p-5 sm:p-6"><EmptyState icon={Truck} title="No deliveries found" description="Try changing the date, area, driver, status, or search filters." /></div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] text-left">
              <thead className="border-b border-espresso/8 bg-crust/25"><tr className="font-mono text-[10px] uppercase tracking-wider text-espresso/45"><th className="px-5 py-3 font-medium">Date</th><th className="px-4 py-3 font-medium">Store</th><th className="px-4 py-3 font-medium">Area</th><th className="px-4 py-3 font-medium">Delivery guy</th><th className="px-4 py-3 font-medium">Orders</th><th className="px-4 py-3 font-medium">Status</th><th className="px-5 py-3 font-medium">Updated</th></tr></thead>
              <tbody className="divide-y divide-espresso/6">{rows.map((row) => <tr key={row.date + '-' + row.storeId + '-' + row.driverId} className="transition hover:bg-crust/20"><td className="px-5 py-4 font-mono text-xs text-espresso/50">{row.date}</td><td className="px-4 py-4"><p className="font-medium text-espresso">{row.storeName}</p><p className="mt-0.5 font-mono text-[10px] text-espresso/40">{row.storeId}</p></td><td className="px-4 py-4 text-sm text-espresso/65">{row.areaName}</td><td className="px-4 py-4 text-sm text-espresso/65">{row.driverName}</td><td className="px-4 py-4 font-mono text-sm text-espresso/70">{row.deliveredOrders}/{row.totalOrders}</td><td className="px-4 py-4"><StatusBadge status={row.status} /></td><td className="px-5 py-4 text-sm text-espresso/50">{formatUpdated(row.lastUpdated)}</td></tr>)}</tbody>
            </table>
          </div>
          <Pagination page={pagination?.page || page} totalPages={pagination?.totalPages || 1} onPageChange={setPage} totalItems={pagination?.totalItems || rows.length} pageSize={PAGE_SIZE} />
        </>
      )}
    </section>
  )
}

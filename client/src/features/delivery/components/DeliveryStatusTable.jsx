import { useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, CheckCircle2, CircleDot, Clock3, Filter, Search, Truck } from 'lucide-react'
import { EmptyState, ErrorState, ExportMenu, PageHeader, Pagination, inputClass } from '@/components/shared'
import { useAreas } from '@/features/sales/hooks'
import { useWorkers } from '@/features/workers/hooks'
import { useDeliveryStatus } from '@/features/delivery/hooks'
import { deliveryApi } from '@/features/delivery/api/deliveryApi'
import { daysAgoISO, formatDateShort, isReversedRange, todayISO, exportPDF, exportExcel } from '@/utils'

const PAGE_SIZE = 6

const DATE_OPTIONS = [
  ['today', 'Today'],
  ['yesterday', 'Yesterday'],
  ['specific', 'Specific date'],
  ['custom', 'Custom range'],
  ['all', 'All dates'],
]

const STATUS_META = {
  all: { label: 'All', className: 'bg-espresso/5 text-espresso/45', icon: Truck },
  delivered: { label: 'Delivered', className: 'bg-matcha-glaze/15 text-matcha-glaze', icon: CheckCircle2 },
  partial: { label: 'Partial', className: 'bg-berry-jam/15 text-berry-jam', icon: Truck },
  pending: { label: 'Pending', className: 'bg-oven-amber/15 text-oven-amber', icon: CircleDot },
  no_orders: { label: 'No orders', className: 'bg-espresso/5 text-espresso/45', icon: Clock3 },
}

const STATUS_PILL_OPTIONS = ['all', 'delivered', 'partial', 'pending', 'no_orders']

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
  const [moreOpen, setMoreOpen] = useState(false)
  const [page, setPage] = useState(1)

  const areasQuery = useAreas()
  const workersQuery = useWorkers()

  const dateRange = useMemo(() => {
    if (dateMode === 'today') return { from: todayISO(), to: todayISO() }
    if (dateMode === 'yesterday') return { from: daysAgoISO(1), to: daysAgoISO(1) }
    if (dateMode === 'specific') return { from: specificDate, to: specificDate }
    // "all" is genuinely unbounded - from/to stay undefined so the
    // backend doesn't fall back to defaulting each side to today (see
    // listDeliveryStatus in status.service.js).
    if (dateMode === 'all') return { from: undefined, to: undefined }
    return { from: fromDate, to: toDate }
  }, [dateMode, fromDate, specificDate, toDate])

  const invalidDateRange = dateMode === 'custom' && isReversedRange(fromDate, toDate)
  const moreActive = area !== 'all' || driver !== 'all'

  const query = useMemo(() => ({
    page,
    pageSize: PAGE_SIZE,
    filter: dateMode === 'all' ? 'all' : 'custom',
    from: dateRange.from,
    to: dateRange.to,
    areaId: area === 'all' ? undefined : area,
    driverId: driver === 'all' ? undefined : driver,
    status: status === 'all' ? undefined : status,
    search: search.trim() || undefined,
  }), [area, dateMode, dateRange, driver, page, search, status])
  const queryEnabled = !invalidDateRange && (dateMode === 'all' || Boolean(dateRange.from && dateRange.to))
  const statusQuery = useDeliveryStatus(query, { enabled: queryEnabled })

  const areas = areasQuery.data || []
  const drivers = (workersQuery.data || []).filter((worker) => worker.roles?.includes('delivery')).sort((a, b) => a.name.localeCompare(b.name))
  const rows = statusQuery.data?.rows || []
  const pagination = statusQuery.data?.pagination
  const isLoading = statusQuery.isLoading || areasQuery.isLoading || workersQuery.isLoading
  const isError = statusQuery.isError || areasQuery.isError || workersQuery.isError
  const isFetching = statusQuery.isFetching || areasQuery.isFetching || workersQuery.isFetching
  const dateCaption = dateMode === 'today' ? 'Today' : dateMode === 'yesterday' ? 'Yesterday' : dateMode === 'specific' ? specificDate : dateMode === 'all' ? 'All dates' : fromDate + '–' + toDate

  useEffect(() => {
    setPage(1)
  }, [area, dateMode, driver, fromDate, search, specificDate, status, toDate])

  useEffect(() => {
    if (pagination?.page && pagination.page !== page) setPage(pagination.page)
  }, [page, pagination?.page])

  // Exports cover every record matching the current filters, not just the
  // page on screen - fetched fresh (unpaginated, `page` omitted) at export
  // time, same pattern as RawMaterials.jsx's fetchAllFilteredMaterials.
  const fetchAllFilteredRows = async () => {
    const { rows: all } = await deliveryApi.getStatus({ ...query, page: undefined, pageSize: undefined })
    return all
  }
  const statusRow = (row) => [formatDateShort(row.date), row.storeName, row.areaName, row.driverName, `${row.deliveredOrders}/${row.totalOrders}`, STATUS_META[row.status]?.label || row.status, formatUpdated(row.lastUpdated)]

  const handleExportPDF = async () => {
    const all = await fetchAllFilteredRows()
    exportPDF({
      title: 'Delivery Status',
      subtitle: 'Break Times Bakery',
      columns: ['Date', 'Store', 'Area', 'Delivery Guy', 'Orders', 'Status', 'Updated'],
      rows: all.map(statusRow),
      filename: 'delivery-status.pdf',
      orientation: 'landscape',
    })
  }
  const handleExportExcel = async () => {
    const all = await fetchAllFilteredRows()
    exportExcel({
      title: 'Delivery Status',
      subtitle: 'Break Times Bakery',
      columns: ['Date', 'Store', 'Area', 'Delivery Guy', 'Orders', 'Status', 'Updated'],
      rows: all.map(statusRow),
      sheetName: 'Delivery Status',
      filename: 'delivery-status.xlsx',
    })
  }

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
    setMoreOpen(false)
  }

  const summaryParts = []
  if (dateMode !== 'all') summaryParts.push(dateCaption)
  if (status !== 'all') summaryParts.push(STATUS_META[status].label)
  if (area !== 'all') summaryParts.push(areas.find((a) => a.id === area)?.name)
  if (driver !== 'all') summaryParts.push(drivers.find((d) => d.id === driver)?.name)
  if (search) summaryParts.push(`"${search}"`)

  return (
    <div>
      <PageHeader
        eyebrow="Delivery / Status"
        title="Delivery status"
        description="Track every assigned store by area, delivery guy, and delivery progress."
        actions={<ExportMenu onExportPDF={handleExportPDF} onExportExcel={handleExportExcel} />}
      />

      {/* Filter bar */}
      <div className="mb-4 rounded-bakery border border-espresso/8 bg-proof-cream p-4 shadow-bakery">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:flex-wrap">
          <label className="relative block min-w-0 flex-1 lg:flex-[1.4]">
            <span className="sr-only">Search delivery status</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-espresso/35" />
            <input className={inputClass + ' pl-9'} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search store, area, driver…" />
          </label>
          <select className={`${inputClass} lg:w-36`} value={dateMode} onChange={(event) => setDateMode(event.target.value)}>
            {DATE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          {dateMode === 'specific' && <input type="date" className={`${inputClass} lg:w-36`} value={specificDate} onChange={(event) => setSpecificDate(event.target.value)} />}
          {dateMode === 'custom' && <>
            <input type="date" aria-invalid={invalidDateRange} className={`${inputClass} lg:w-36`} value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
            <input type="date" aria-invalid={invalidDateRange} className={`${inputClass} lg:w-36`} value={toDate} onChange={(event) => setToDate(event.target.value)} />
          </>}
          <div className="inline-flex flex-wrap rounded-full bg-crust p-0.5">
            {STATUS_PILL_OPTIONS.map((s) => (
              <button key={s} onClick={() => setStatus(s)} className={`rounded-full px-3 py-1 text-xs font-medium transition ${status === s ? 'bg-espresso text-crust' : 'text-espresso/60'}`}>{STATUS_META[s].label}</button>
            ))}
          </div>
          <button onClick={() => setMoreOpen((o) => !o)} className="relative inline-flex items-center gap-1.5 rounded-lg border border-espresso/15 bg-crust/30 px-3 py-2 text-xs font-medium text-espresso hover:bg-crust/50">
            <Filter className="h-3.5 w-3.5" /> More filters
            {moreActive && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-cherry-compote text-[9px] font-bold text-crust">!</span>}
          </button>
        </div>

        {moreOpen && (
          <div className="mt-3 grid grid-cols-1 gap-2 border-t border-espresso/8 pt-3 sm:grid-cols-2">
            <select className={inputClass} value={area} onChange={(event) => setArea(event.target.value)}>
              <option value="all">All areas</option>
              {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <select className={inputClass} value={driver} onChange={(event) => setDriver(event.target.value)}>
              <option value="all">All drivers</option>
              {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        )}
        {invalidDateRange && <p className="mt-2 text-xs text-cherry-compote" role="alert">The custom range&apos;s start date must be before its end date.</p>}
      </div>

      {/* Summary */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="font-display text-lg font-semibold text-espresso">{pagination?.totalItems ?? rows.length} {(pagination?.totalItems ?? rows.length) === 1 ? 'delivery record' : 'delivery records'}</h2>
        {summaryParts.length > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-oven-amber/10 px-3 py-1 text-xs text-espresso/70">
            Showing: {summaryParts.join(' · ')}
            <button onClick={clearFilters} className="text-oven-amber hover:underline">Clear filters</button>
          </span>
        )}
      </div>

      {isError ? (
        <ErrorState description="Could not load delivery status." onRetry={retry} retrying={isFetching} />
      ) : isLoading ? (
        <p className="px-1 py-8 text-center text-sm text-espresso/40">Loading delivery status...</p>
      ) : rows.length === 0 ? (
        <EmptyState icon={Truck} title="No deliveries found" description="Try adjusting your filters." />
      ) : (
        <div className="overflow-hidden rounded-bakery border border-espresso/8 bg-proof-cream shadow-bakery">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-sm">
              <thead>
                <tr className="border-b border-espresso/10 bg-crust/30 text-left">
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Date</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Store</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Area</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Delivery guy</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Orders</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Status</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Updated</th>
                  <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-espresso/50">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.date + '-' + row.storeId + '-' + row.driverId} className="border-b border-espresso/8 last:border-0 hover:bg-crust/20">
                    <td className="px-4 py-3 font-mono text-xs text-espresso/50">{row.date}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-espresso">{row.storeName}</p>
                      <p className="mt-0.5 font-mono text-[10px] text-espresso/40">{row.storeId}</p>
                    </td>
                    <td className="px-4 py-3 text-espresso/65">{row.areaName}</td>
                    <td className="px-4 py-3 text-espresso/65">{row.driverName}</td>
                    <td className="px-4 py-3 font-mono text-espresso/70">{row.deliveredOrders}/{row.totalOrders}</td>
                    <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                    <td className="px-4 py-3 text-espresso/50">{formatUpdated(row.lastUpdated)}</td>
                    <td className="px-4 py-3 text-right">
                      {row.totalOrders > 0 ? (
                        <Link
                          to="/sales/orders/$areaId"
                          params={{ areaId: row.areaId }}
                          search={{ storeId: row.storeId, date: row.date }}
                          className="inline-flex items-center gap-1 text-xs font-medium text-oven-amber hover:underline"
                        >
                          View orders <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      ) : (
                        <span className="text-xs text-espresso/30">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={pagination?.page || page} totalPages={pagination?.totalPages || 1} onPageChange={setPage} totalItems={pagination?.totalItems || rows.length} pageSize={PAGE_SIZE} />
        </div>
      )}
    </div>
  )
}

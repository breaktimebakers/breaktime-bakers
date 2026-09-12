import { useMemo, useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { MapPin, ArrowRight, Search, Store } from 'lucide-react'
import { useAreaStoreSummaries } from '@/features/finance/hooks'
import { useAreas } from '@/features/sales/hooks'
import { usePagination } from '@/hooks'
import { isReversedRange } from '@/utils'
import { EmptyState, ErrorState, PageHeader, Pagination, StatCard, inputClass } from '@/components/shared'
import { PaidBadge } from '../components/PaidBadge'

const PAGE_SIZE = 10

const paymentStatusFor = (row) => (row.paid <= 0 ? 'unpaid' : row.paid >= row.totalBilled ? 'paid' : 'partial')

export default function CustomerPaymentsArea() {
  const { areaId } = useParams({ strict: false })
  const [search, setSearch] = useState('')
  const [dateMode, setDateMode] = useState('all')
  const [specificDate, setSpecificDate] = useState('')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const dateInputIncomplete = dateMode === 'specific' && !specificDate
  const dateRangeInvalid = dateMode === 'custom' && isReversedRange(customFrom, customTo)
  const dateInputReady = !dateInputIncomplete && !dateRangeInvalid
  const dateQuery = useMemo(() => {
    if (dateMode === 'today' || dateMode === 'week') return { filter: dateMode }
    if (dateMode === 'specific') return { filter: 'custom', from: specificDate, to: specificDate }
    if (dateMode === 'custom') {
      return {
        filter: 'custom',
        from: customFrom || undefined,
        to: customTo || undefined,
      }
    }
    return { filter: 'all' }
  }, [dateMode, specificDate, customFrom, customTo])

  const { data: areas = [] } = useAreas()
  const { data: storeRows = [], isLoading, isError, error, refetch } = useAreaStoreSummaries(
    areaId,
    dateQuery,
    { enabled: dateInputReady },
  )

  const area = areas.find((a) => a.id === areaId)
  const totalOutstanding = storeRows.reduce((s, r) => s + (r.totalBilled - r.paid), 0)
  const totalPaid = storeRows.reduce((s, r) => s + r.paid, 0)
  const filteredStoreRows = useMemo(() => {
    const term = search.trim().toLowerCase()

    return storeRows.filter((row) => {
      if (term && !row.storeName.toLowerCase().includes(term)) return false
      if (statusFilter !== 'all' && paymentStatusFor(row) !== statusFilter) return false
      return true
    })
  }, [storeRows, search, statusFilter])
  const paginationResetKey = `${areaId}|${dateMode}|${specificDate}|${customFrom}|${customTo}|${search}|${statusFilter}`
  const { page, setPage, totalPages, start, end } = usePagination(filteredStoreRows.length, PAGE_SIZE, paginationResetKey)
  const pagedStoreRows = filteredStoreRows.slice(start, end)

  const clearFilters = () => {
    setSearch('')
    setDateMode('all')
    setSpecificDate('')
    setCustomFrom('')
    setCustomTo('')
    setStatusFilter('all')
  }
  const hasActiveFilters = Boolean(search) || dateMode !== 'all' || statusFilter !== 'all'

  if (!area) return <EmptyState icon={MapPin} title="Area not found" description="This area does not exist." />

  return (
    <div>
      <div className="mb-4 flex items-center gap-1.5 text-sm text-espresso/50">
        <Link to="/finance/customer-payments" className="hover:text-oven-amber">Customer Payments</Link>
        <span>/</span>
        <span className="text-espresso">{area.name}</span>
      </div>

      <PageHeader eyebrow="Finance / Customer Payments" title={area.name} description={`${storeRows.length} ${storeRows.length === 1 ? 'store' : 'stores'} in this area`} />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-4">
        <StatCard label="Outstanding" value={`₹${totalOutstanding.toLocaleString('en-IN')}`} icon={MapPin} chipColor="bg-cherry-compote/15 text-cherry-compote" danger={totalOutstanding > 0} />
        <StatCard label="Paid" value={`₹${totalPaid.toLocaleString('en-IN')}`} icon={Store} chipColor="bg-matcha-glaze/15 text-matcha-glaze" />
      </div>

      <div className="mb-4 rounded-bakery border border-espresso/8 bg-proof-cream p-4 shadow-bakery">
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
          <label className="relative block min-w-0 flex-1 lg:min-w-[220px]">
            <span className="sr-only">Search store name</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-espresso/35" />
            <input className={`${inputClass} pl-9`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search store name…" />
          </label>
          <select className={`${inputClass} lg:w-40`} value={dateMode} onChange={(event) => setDateMode(event.target.value)}>
            <option value="all">All dates</option>
            <option value="today">Today</option>
            <option value="week">Last 7 days</option>
            <option value="specific">Specific date</option>
            <option value="custom">Custom range</option>
          </select>
          {dateMode === 'specific' && (
            <input type="date" className={`${inputClass} lg:w-40`} value={specificDate} onChange={(event) => setSpecificDate(event.target.value)} />
          )}
          {dateMode === 'custom' && (
            <>
              <input type="date" aria-label="Start date" aria-invalid={dateRangeInvalid} className={`${inputClass} lg:w-40`} value={customFrom} onChange={(event) => setCustomFrom(event.target.value)} />
              <input type="date" aria-label="End date" aria-invalid={dateRangeInvalid} className={`${inputClass} lg:w-40`} value={customTo} onChange={(event) => setCustomTo(event.target.value)} />
            </>
          )}
          <div className="inline-flex rounded-full bg-crust p-0.5">
            {[
              ['all', 'All'],
              ['unpaid', 'Outstanding'],
              ['partial', 'Partial'],
              ['paid', 'Paid'],
            ].map(([value, label]) => (
              <button key={value} type="button" onClick={() => setStatusFilter(value)} className={`rounded-full px-3 py-1 text-xs font-medium transition ${statusFilter === value ? 'bg-espresso text-crust' : 'text-espresso/60'}`}>
                {label}
              </button>
            ))}
          </div>
          {hasActiveFilters && <button type="button" onClick={clearFilters} className="text-xs font-medium text-oven-amber hover:underline">Clear filters</button>}
        </div>
        {dateRangeInvalid && <p role="alert" className="mt-2 text-xs text-cherry-compote">The start date must be before the end date.</p>}
      </div>

      {dateInputIncomplete ? (
        <EmptyState icon={Store} title="Pick a date" description="Choose a specific date to view customer payments." />
      ) : dateRangeInvalid ? (
        <EmptyState icon={Store} title="Invalid date range" description="The start date must be before the end date." />
      ) : isError ? (
        <ErrorState description={error?.message} onRetry={refetch} />
      ) : isLoading ? (
        <p role="status" className="text-sm text-espresso/50">Loading store summaries…</p>
      ) : storeRows.length === 0 ? (
        <EmptyState icon={Store} title={dateMode === 'all' ? 'No stores in this area' : 'No customer payments in this period'} description={dateMode === 'all' ? 'Add stores to this area first.' : 'Try selecting a different date or range.'} />
      ) : filteredStoreRows.length === 0 ? (
        <EmptyState icon={Store} title="No stores match your filters" description="Try a different store name or payment status." />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-bakery border border-espresso/8 bg-proof-cream shadow-bakery lg:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-espresso/10 bg-crust/30 text-left">
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Store</th>
                  <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-espresso/50">Total Billed</th>
                  <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-espresso/50">Paid</th>
                  <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-espresso/50">Outstanding</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Status</th>
                  <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-espresso/50"></th>
                </tr>
              </thead>
              <tbody>
                {pagedStoreRows.map((r) => (
                  <tr key={r.storeId} className="border-b border-espresso/8 last:border-0 hover:bg-crust/20">
                    <td className="px-4 py-3 font-medium text-espresso">{r.storeName}</td>
                    <td className="px-4 py-3 text-right font-mono text-espresso/70">₹{r.totalBilled.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right font-mono text-matcha-glaze">₹{r.paid.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right font-mono text-cherry-compote">₹{(r.totalBilled - r.paid).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3"><PaidBadge status={paymentStatusFor(r)} /></td>
                    <td className="px-4 py-3 text-right">
                      <Link to="/finance/customer-payments/$areaId/$storeId" params={{ areaId, storeId: r.storeId }}
                        className="inline-flex items-center gap-1 text-xs font-medium text-oven-amber hover:underline">
                        History <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={filteredStoreRows.length} pageSize={PAGE_SIZE} />
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden">
            <div className="flex flex-col gap-3">
              {pagedStoreRows.map((r) => (
                <Link key={r.storeId} to="/finance/customer-payments/$areaId/$storeId" params={{ areaId, storeId: r.storeId }}
                  className="rounded-bakery border border-espresso/8 bg-proof-cream p-4 shadow-bakery transition hover:shadow-bakery-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-espresso">{r.storeName}</p>
                      <p className="text-xs text-espresso/50">{r.storeType}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-espresso/30" />
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div><p className="font-mono text-[10px] uppercase text-espresso/40">Billed</p><p className="font-mono text-sm font-bold text-espresso">₹{r.totalBilled.toLocaleString('en-IN')}</p></div>
                    <div><p className="font-mono text-[10px] uppercase text-espresso/40">Paid</p><p className="font-mono text-sm font-bold text-matcha-glaze">₹{r.paid.toLocaleString('en-IN')}</p></div>
                    <div><p className="font-mono text-[10px] uppercase text-espresso/40">Outstanding</p><p className="font-mono text-sm font-bold text-cherry-compote">₹{(r.totalBilled - r.paid).toLocaleString('en-IN')}</p></div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-3 overflow-hidden rounded-bakery border border-espresso/8 bg-proof-cream shadow-bakery">
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={filteredStoreRows.length} pageSize={PAGE_SIZE} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

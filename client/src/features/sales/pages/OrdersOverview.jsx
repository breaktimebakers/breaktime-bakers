import { useState, useMemo, Fragment } from 'react'
import { Link, useParams, useSearch } from '@tanstack/react-router'
import { Plus, Filter, ChevronDown, ChevronRight, ClipboardList } from 'lucide-react'
import { usePaginatedOrders, useAllStores, useAreas, useUpdateOrderStatus } from '@/features/sales/hooks'
import { orderApi } from '@/features/sales/api/orderApi'
import { useWorkers } from '@/features/workers/hooks'
import { useReadyStock } from '@/features/inventory/hooks'
import { Button, EmptyState, ExportMenu, PageHeader, Pagination, inputClass } from '@/components/shared'
import { ORDER_STATUS } from '@/constants/orderStatus'
import { formatDateShort, isReversedRange, exportPDF, exportExcel } from '@/utils'
import { StatusDropdown } from '../components/StatusDropdown'
import { AddOrderModal } from '../components/AddOrderModal'
import { FillOrderModal } from '../components/FillOrderModal'
import { OrderProductsTable } from '../components/OrderProductsTable'

const PAGE_SIZE = 8

export default function OrdersOverview() {
  const { areaId } = useParams({ strict: false })
  // Deep-link params from the Delivery Status table ("View orders" on a
  // row) - read once on mount to seed the filters below, same idea as
  // Login.jsx's sessionExpired search param.
  const { storeId: linkedStoreId, date: linkedDate } = useSearch({ strict: false })
  const { data: areas = [] } = useAreas()
  const { data: stores = [] } = useAllStores()
  const { data: workers = [] } = useWorkers()
  // "all" - see AddOrderModal.jsx for why this can't use the hook's own
  // "today" default (would silently drop the product filter dropdown
  // down to only products with a stock movement today).
  const { data: products = [] } = useReadyStock({ filter: 'all' })
  const area = areas.find((a) => a.id === areaId)
  const [expandedIds, setExpandedIds] = useState(() => new Set())
  const toggleExpanded = (id) => setExpandedIds((previous) => {
    const next = new Set(previous)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })
  const [addOpen, setAddOpen] = useState(false)
  const [fillOrder, setFillOrder] = useState(null)

  // Defaults to "today" - matches the backend's own default and the
  // requirement that Orders shows only today's orders unless asked for
  // more - unless a linked date came in from Delivery Status, in which
  // case that specific date wins instead.
  const [dateMode, setDateMode] = useState(linkedDate ? 'specific' : 'today')
  const [specificDate, setSpecificDate] = useState(linkedDate || '')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [productFilter, setProductFilter] = useState('all')
  // Starts open when a linked store came in, so the pre-applied filter is
  // visible rather than hidden behind the collapsed "More filters" panel.
  const [moreOpen, setMoreOpen] = useState(Boolean(linkedStoreId))
  const [storeFilter, setStoreFilter] = useState(linkedStoreId || 'all')
  const [otFilter, setOtFilter] = useState('all')

  const moreActive = storeFilter !== 'all' || otFilter !== 'all'
  const orderTakers = useMemo(() => workers.filter((w) => w.roles.includes('marketer')), [workers])

  // Filtering happens server-side now (see order.validation.js) rather
  // than fetching everything and filtering client-side - this is what
  // makes the "today by default" behavior actually cheap as orders
  // accumulate over time.
  // A date input mid-selection ("Specific date" chosen but nothing picked
  // yet) or backwards (custom range with `from` after `to`) must not fire
  // a query at all - sending it anyway either silently returns everything
  // (empty from/to) or gets rejected by the backend as invalid, neither of
  // which is what "still choosing a date" should look like to the user.
  const dateInputIncomplete = dateMode === 'specific' && !specificDate
  const dateRangeInvalid = dateMode === 'custom' && isReversedRange(customFrom, customTo)
  const dateInputReady = !dateInputIncomplete && !dateRangeInvalid

  const query = useMemo(() => {
    const q = {}
    if (dateMode === 'today') q.filter = 'today'
    else if (dateMode === 'specific') { q.filter = 'custom'; q.from = specificDate; q.to = specificDate }
    else if (dateMode === 'custom') { q.filter = 'custom'; if (customFrom) q.from = customFrom; if (customTo) q.to = customTo }
    else q.filter = 'all'
    if (areaId) q.areaId = areaId
    if (statusFilter !== 'all') q.status = statusFilter
    if (productFilter !== 'all') q.productId = productFilter
    if (storeFilter !== 'all') q.storeId = storeFilter
    if (otFilter !== 'all') q.orderTakerId = otFilter
    return q
  }, [dateMode, specificDate, customFrom, customTo, areaId, statusFilter, productFilter, storeFilter, otFilter])

  // Resets to page 1 whenever any filter actually changes - otherwise
  // narrowing the filter while sitting on page 5 could land on a page
  // past the new (smaller) result set. Same pattern as OrderTakersList.jsx.
  const paginationResetKey = JSON.stringify(query)
  const [pageState, setPageState] = useState({ key: paginationResetKey, page: 1 })
  const requestedPage = pageState.key === paginationResetKey ? pageState.page : 1
  if (pageState.key !== paginationResetKey) setPageState({ key: paginationResetKey, page: 1 })
  const setPage = (nextPage) => setPageState({ key: paginationResetKey, page: nextPage })

  const { data, isLoading, isError } = usePaginatedOrders(
    { ...query, page: requestedPage, pageSize: PAGE_SIZE },
    { enabled: dateInputReady },
  )
  const orders = data?.orders || []
  const { page = requestedPage, totalPages = 1, totalItems = 0 } = data?.pagination || {}
  const updateOrderStatus = useUpdateOrderStatus()

  // Exports cover every order matching the current filters, not just the
  // page on screen - fetched fresh (unpaginated) at export time, same
  // pattern as RawMaterials.jsx's fetchAllFilteredMaterials.
  const fetchAllFilteredOrders = async () => {
    const { orders: all } = await orderApi.list(query)
    return all
  }

  const orderRow = (o) => {
    const store = stores.find((s) => s.id === o.storeId)
    const area = areas.find((a) => a.id === store?.areaId)
    const items = o.items || []
    const totalQty = items.reduce((s, it) => s + it.quantity, 0)
    const productsLabel = items.length === 0 ? '—' : items.map((it) => `${it.productName} (${it.quantity})`).join(', ')
    return [store?.dealerName || '—', area?.name || '—', o.otName || '—', productsLabel, totalQty, ORDER_STATUS[o.status]?.label || o.status, formatDateShort(o.orderDate)]
  }

  const handleExportPDF = async () => {
    const all = await fetchAllFilteredOrders()
    exportPDF({
      title: 'Orders',
      subtitle: 'Break Times Bakery',
      columns: ['Store', 'Area', 'Order Taker', 'Products', 'Qty', 'Status', 'Date'],
      rows: all.map(orderRow),
      filename: 'orders.pdf',
      orientation: 'landscape',
    })
  }
  const handleExportExcel = async () => {
    const all = await fetchAllFilteredOrders()
    exportExcel({
      title: 'Orders',
      subtitle: 'Break Times Bakery',
      columns: ['Store', 'Area', 'Order Taker', 'Products', 'Qty', 'Status', 'Date'],
      rows: all.map(orderRow),
      sheetName: 'Orders',
      filename: 'orders.xlsx',
    })
  }

  const clearFilters = () => {
    setDateMode('today'); setSpecificDate(''); setCustomFrom(''); setCustomTo(''); setStatusFilter('all'); setProductFilter('all'); setStoreFilter('all'); setOtFilter('all')
  }

  const summaryParts = []
  if (dateMode !== 'all') summaryParts.push(dateMode === 'today' ? 'Today' : dateMode === 'specific' ? specificDate : `${customFrom}–${customTo}`)
  if (statusFilter !== 'all') summaryParts.push(statusFilter)
  if (productFilter !== 'all') summaryParts.push(products.find((p) => p.id === productFilter)?.name)
  if (storeFilter !== 'all') summaryParts.push(stores.find((s) => s.id === storeFilter)?.dealerName)
  if (otFilter !== 'all') summaryParts.push(orderTakers.find((o) => o.id === otFilter)?.name)

  return (
    <div>
      {areaId && area && (
        <div className="mb-4 flex items-center gap-1.5 text-sm text-espresso/50">
          <Link to="/sales/orders" className="hover:text-oven-amber">Orders</Link>
          <span>/</span>
          <span className="text-espresso">{area.name}</span>
        </div>
      )}
      <PageHeader eyebrow="Sales / Orders" title={areaId && area ? area.name : 'Orders'} description={areaId && area ? `${area.city} · ${area.pincode}` : 'View, filter, and fulfill store orders.'} actions={<>
        <ExportMenu onExportPDF={handleExportPDF} onExportExcel={handleExportExcel} />
        <Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" /> Add order</Button>
      </>} />

      {/* Filter bar */}
      <div className="mb-4 rounded-bakery border border-espresso/8 bg-proof-cream p-4 shadow-bakery">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:flex-wrap">
          <select className={`${inputClass} lg:w-36`} value={dateMode} onChange={(e) => setDateMode(e.target.value)}>
            <option value="today">Today</option><option value="all">All dates</option><option value="specific">Specific date</option><option value="custom">Custom range</option>
          </select>
          {dateMode === 'specific' && <input type="date" className={`${inputClass} lg:w-36`} value={specificDate} onChange={(e) => setSpecificDate(e.target.value)} />}
          {dateMode === 'custom' && <>
            <input type="date" aria-invalid={dateRangeInvalid} className={`${inputClass} lg:w-36`} value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
            <input type="date" aria-invalid={dateRangeInvalid} className={`${inputClass} lg:w-36`} value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
            {dateRangeInvalid && <p role="alert" className="text-xs text-cherry-compote">The start date must be before the end date.</p>}
          </>}
          <div className="inline-flex rounded-full bg-crust p-0.5">
            {['all', 'undelivered', 'delivered'].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)} className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition ${statusFilter === s ? 'bg-espresso text-crust' : 'text-espresso/60'}`}>{s}</button>
            ))}
          </div>
          <select className={`${inputClass} lg:w-40`} value={productFilter} onChange={(e) => setProductFilter(e.target.value)}>
            <option value="all">All products</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button onClick={() => setMoreOpen((o) => !o)} className="relative inline-flex items-center gap-1.5 rounded-lg border border-espresso/15 bg-crust/30 px-3 py-2 text-xs font-medium text-espresso hover:bg-crust/50">
            <Filter className="h-3.5 w-3.5" /> More filters
            {moreActive && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-cherry-compote text-[9px] font-bold text-crust">!</span>}
          </button>

        </div>

        {moreOpen && (
          <div className="mt-3 grid grid-cols-1 gap-2 border-t border-espresso/8 pt-3 sm:grid-cols-2">
            <select className={inputClass} value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)}>
              <option value="all">All stores</option>
              {stores.filter((s) => !areaId || s.areaId === areaId).map((s) => <option key={s.id} value={s.id}>{s.dealerName}</option>)}
            </select>
            <select className={inputClass} value={otFilter} onChange={(e) => setOtFilter(e.target.value)}>
              <option value="all">All order takers</option>
              {orderTakers.map((ot) => <option key={ot.id} value={ot.id}>{ot.name}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="font-display text-lg font-semibold text-espresso">{totalItems} {totalItems === 1 ? 'order' : 'orders'}</h2>
        {summaryParts.length > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-oven-amber/10 px-3 py-1 text-xs text-espresso/70">
            Showing: {summaryParts.join(' · ')}
            <button onClick={clearFilters} className="text-oven-amber hover:underline">Clear filters</button>
          </span>
        )}
      </div>

      {dateInputIncomplete ? (
        <EmptyState icon={ClipboardList} title="Pick a date" description="Choose a specific date above to see its orders." />
      ) : dateRangeInvalid ? (
        <EmptyState icon={ClipboardList} title="Invalid date range" description="The start date must be before the end date." />
      ) : isLoading ? (
        <p className="px-1 py-8 text-center text-sm text-espresso/40">Loading orders...</p>
      ) : isError ? (
        <EmptyState icon={ClipboardList} title="Could not load orders" description="Something went wrong fetching orders. Try refreshing." />
      ) : totalItems === 0 ? (
        <EmptyState icon={ClipboardList} title="No orders found" description="Try adjusting your filters." />
      ) : (
        <div className="overflow-hidden rounded-bakery border border-espresso/8 bg-proof-cream shadow-bakery">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="border-b border-espresso/10 bg-crust/30 text-left">
                  <th scope="col" className="w-10 px-2 py-3"><span className="sr-only">Order products</span></th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Store</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Area</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Order Taker</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Products</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Qty</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Status</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Date</th>
                  <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-espresso/50">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const store = stores.find((s) => s.id === o.storeId)
                  const area = areas.find((a) => a.id === store?.areaId)
                  const cfg = ORDER_STATUS[o.status]
                  const items = o.items || []
                  const totalQty = items.reduce((s, it) => s + it.quantity, 0)
                  const expandable = items.length > 1
                  const isExpanded = expandable && expandedIds.has(o.id)
                  return (
                    <Fragment key={o.id}>
                      <tr onClick={expandable ? () => toggleExpanded(o.id) : undefined} className={`border-b border-espresso/8 last:border-0 hover:bg-crust/20 ${expandable ? 'cursor-pointer' : ''} ${isExpanded ? 'bg-crust/40' : ''}`}>
                        <td className="px-2 py-3">
                          {expandable && (
                            <button
                              type="button"
                              aria-label={`${isExpanded ? 'Hide' : 'Show'} products for ${store?.dealerName || 'order'}`}
                              aria-expanded={isExpanded}
                              aria-controls={isExpanded ? `area-order-products-${o.id}` : undefined}
                              onClick={(event) => { event.stopPropagation(); toggleExpanded(o.id) }}
                              className="flex h-7 w-7 items-center justify-center rounded-md text-espresso/50 hover:bg-espresso/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oven-amber"
                            >
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium text-espresso">{store?.dealerName}</td>
                        <td className="px-4 py-3 text-espresso/60">{area?.name}</td>
                        <td className="px-4 py-3 text-espresso/70">{o.otName}</td>
                        <td className="px-4 py-3 text-espresso/80">
                          {items.length === 0 ? '—' : items.length === 1 ? items[0].productName : `${items[0].productName} +${items.length - 1} more`}
                        </td>
                        <td className="px-4 py-3 font-mono text-espresso">{totalQty}</td>
                        <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 text-xs ${cfg.color}`}><cfg.icon className="h-3.5 w-3.5" />{cfg.label}</span></td>
                        <td className="px-4 py-3 text-espresso/60">{formatDateShort(o.orderDate)}</td>
                        <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="secondary" onClick={() => setFillOrder(o)}>Fill</Button>
                            <StatusDropdown order={o} onUpdate={(s) => updateOrderStatus.mutate({ id: o.id, status: s })} />
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="border-b border-espresso/8 bg-crust/20 last:border-0">
                          <td colSpan={9} className="px-4 py-4">
                            <OrderProductsTable order={{ ...o, storeName: store?.dealerName, totalQty }} id={`area-order-products-${o.id}`} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} pageSize={PAGE_SIZE} />
        </div>
      )}

      <AddOrderModal open={addOpen} onClose={() => setAddOpen(false)} areaId={areaId} />
      <FillOrderModal open={!!fillOrder} onClose={() => setFillOrder(null)} order={fillOrder} />
    </div>
  )
}

import { useState, useMemo } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { Plus, Filter, LayoutGrid, Table as TableIcon, Truck, PackageCheck, CircleCheck, CheckSquare, Square, ClipboardList } from 'lucide-react'
import { useSales } from '@/features/sales/hooks'
import { Button, EmptyState, PageHeader, Pagination, inputClass } from '@/components/shared'
import { usePagination } from '@/hooks'
import { ORDER_STATUS } from '@/constants/orderStatus'
import { formatDateShort } from '@/utils'
import { StatusDropdown } from '../components/StatusDropdown'
import { AddOrderModal } from '../components/AddOrderModal'
import { FillOrderModal } from '../components/FillOrderModal'
import { OrderTicket } from '../components/OrderTicket'

const PAGE_SIZE = 8
export default function OrdersOverview() {
  const { areaId } = useParams({ strict: false })
  const { orders, stores, areas, orderTakers, updateOrderStatus } = useSales()
  const area = areas.find((a) => a.id === areaId)
  const [view, setView] = useState('cards')
  const [addOpen, setAddOpen] = useState(false)
  const [fillOrder, setFillOrder] = useState(null)
  const [selected, setSelected] = useState(new Set())

  const [dateMode, setDateMode] = useState('all')
  const [specificDate, setSpecificDate] = useState('')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [productFilter, setProductFilter] = useState('all')
  const [moreOpen, setMoreOpen] = useState(false)
  const [storeFilter, setStoreFilter] = useState('all')
  const [otFilter, setOtFilter] = useState('all')

  const moreActive = storeFilter !== 'all' || otFilter !== 'all'

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (areaId) {
        const store = stores.find((s) => s.id === o.storeId)
        if (store?.areaId !== areaId) return false
      }
      if (dateMode === 'today' && o.date !== new Date().toISOString().slice(0, 10)) return false
      if (dateMode === 'specific' && o.date !== specificDate) return false
      if (dateMode === 'custom') {
        if (customFrom && o.date < customFrom) return false
        if (customTo && o.date > customTo) return false
      }
      if (statusFilter === 'undelivered' && o.status === 'delivered') return false
      if (statusFilter === 'delivered' && o.status !== 'delivered') return false
      if (productFilter !== 'all' && o.product !== productFilter) return false
      if (storeFilter !== 'all' && o.storeId !== storeFilter) return false
      if (otFilter !== 'all' && o.orderTakerId !== otFilter) return false
      return true
    })
  }, [orders, areaId, dateMode, specificDate, customFrom, customTo, statusFilter, productFilter, storeFilter, otFilter, stores])

  const { page, setPage, totalPages, start, end } = usePagination(filtered.length, PAGE_SIZE)
  const paged = filtered.slice(start, end)

  const clearFilters = () => {
    setDateMode('all'); setSpecificDate(''); setCustomFrom(''); setCustomTo(''); setStatusFilter('all'); setProductFilter('all'); setStoreFilter('all'); setOtFilter('all')
  }

  const toggleSelect = (id) => {
    setSelected((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n })
  }
  const toggleSelectAllOnPage = () => {
    setSelected((p) => {
      const pageIds = paged.map((o) => o.id)
      const allSelected = pageIds.every((id) => p.has(id))
      const n = new Set(p)
      if (allSelected) { pageIds.forEach((id) => n.delete(id)) } else { pageIds.forEach((id) => n.add(id)) }
      return n
    })
  }
  const bulkUpdateStatus = (status) => {
    selected.forEach((id) => updateOrderStatus(id, status))
    setSelected(new Set())
  }

  const summaryParts = []
  if (dateMode !== 'all') summaryParts.push(dateMode === 'today' ? 'Today' : dateMode === 'specific' ? specificDate : `${customFrom}–${customTo}`)
  if (statusFilter !== 'all') summaryParts.push(statusFilter)
  if (productFilter !== 'all') summaryParts.push(productFilter)
  if (storeFilter !== 'all') summaryParts.push(stores.find((s) => s.id === storeFilter)?.dealerName)
  if (otFilter !== 'all') summaryParts.push(orderTakers.find((o) => o.id === otFilter)?.name)

  const allOnPageSelected = paged.length > 0 && paged.every((o) => selected.has(o.id))

  return (
    <div>
      {areaId && area && (
        <div className="mb-4 flex items-center gap-1.5 text-sm text-espresso/50">
          <Link to="/sales/orders" className="hover:text-oven-amber">Orders</Link>
          <span>/</span>
          <span className="text-espresso">{area.name}</span>
        </div>
      )}
      <PageHeader eyebrow="Sales / Orders" title={areaId && area ? area.name : 'Orders'} description={areaId && area ? `${area.city} · ${area.pincode}` : 'View, filter, and fulfill store orders.'} actions={<Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" /> Add order</Button>} />

      {/* Filter bar */}
      <div className="mb-4 rounded-bakery border border-espresso/8 bg-proof-cream p-4 shadow-bakery">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:flex-wrap">
          <select className={`${inputClass} lg:w-36`} value={dateMode} onChange={(e) => setDateMode(e.target.value)}>
            <option value="all">All dates</option><option value="today">Today</option><option value="specific">Specific date</option><option value="custom">Custom range</option>
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
          <select className={`${inputClass} lg:w-40`} value={productFilter} onChange={(e) => setProductFilter(e.target.value)}>
            <option value="all">All products</option>
            <option>Butter Croissants</option><option>Milk Bread</option><option>Cocoa Cookies</option><option>Dinner Buns</option><option>Tea Cakes</option>
          </select>
          <button onClick={() => setMoreOpen((o) => !o)} className="relative inline-flex items-center gap-1.5 rounded-lg border border-espresso/15 bg-crust/30 px-3 py-2 text-xs font-medium text-espresso hover:bg-crust/50">
            <Filter className="h-3.5 w-3.5" /> More filters
            {moreActive && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-cherry-compote text-[9px] font-bold text-crust">!</span>}
          </button>
          <div className="ml-auto inline-flex rounded-full bg-crust p-0.5">
            <button onClick={() => setView('cards')} className={`rounded-full p-1.5 ${view === 'cards' ? 'bg-espresso text-crust' : 'text-espresso/60'}`}><LayoutGrid className="h-4 w-4" /></button>
            <button onClick={() => setView('table')} className={`rounded-full p-1.5 ${view === 'table' ? 'bg-espresso text-crust' : 'text-espresso/60'}`}><TableIcon className="h-4 w-4" /></button>
          </div>
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

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="mb-4 flex flex-col gap-3 rounded-bakery border border-oven-amber/30 bg-oven-amber/8 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-espresso">{selected.size} selected</span>
            <button onClick={() => setSelected(new Set())} className="text-xs text-espresso/50 hover:text-espresso">Clear selection</button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-espresso/50">Set status:</span>
            <Button size="sm" variant="secondary" onClick={() => bulkUpdateStatus('in_transit')}><Truck className="h-3.5 w-3.5 text-oven-amber" /> In Transit</Button>
            <Button size="sm" variant="secondary" onClick={() => bulkUpdateStatus('shipped')}><PackageCheck className="h-3.5 w-3.5 text-berry-jam" /> Shipped</Button>
            <Button size="sm" variant="secondary" onClick={() => bulkUpdateStatus('delivered')}><CircleCheck className="h-3.5 w-3.5 text-matcha-glaze" /> Delivered</Button>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="font-display text-lg font-semibold text-espresso">{filtered.length} {filtered.length === 1 ? 'order' : 'orders'}</h2>
        {summaryParts.length > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-oven-amber/10 px-3 py-1 text-xs text-espresso/70">
            Showing: {summaryParts.join(' · ')}
            <button onClick={clearFilters} className="text-oven-amber hover:underline">Clear filters</button>
          </span>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No orders found" description="Try adjusting your filters." />
      ) : view === 'cards' ? (
        <>
          <div className="mb-3 flex items-center gap-2">
            <button onClick={toggleSelectAllOnPage} className="inline-flex items-center gap-1.5 text-xs font-medium text-espresso/60 hover:text-espresso">
              {allOnPageSelected ? <CheckSquare className="h-4 w-4 text-oven-amber" /> : <Square className="h-4 w-4" />}
              {allOnPageSelected ? 'Deselect all on page' : 'Select all on page'}
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {paged.map((o) => <OrderTicket key={o.id} order={o} stores={stores} areas={areas} orderTakers={orderTakers} onFill={() => setFillOrder(o)} onStatus={(s) => updateOrderStatus(o.id, s)} selected={selected.has(o.id)} onToggleSelect={() => toggleSelect(o.id)} />)}
          </div>
          <div className="mt-4 rounded-bakery border border-espresso/8 bg-proof-cream shadow-bakery">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
          </div>
        </>
      ) : (
        <div className="overflow-hidden rounded-bakery border border-espresso/8 bg-proof-cream shadow-bakery">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-espresso/10 bg-crust/30 text-left">
                  <th className="px-4 py-3 w-10">
                    <button onClick={toggleSelectAllOnPage}>
                      {allOnPageSelected ? <CheckSquare className="h-4 w-4 text-oven-amber" /> : <Square className="h-4 w-4 text-espresso/40" />}
                    </button>
                  </th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Store</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Area</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Product</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Qty</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Status</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Date</th>
                  <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-espresso/50">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((o) => {
                  const store = stores.find((s) => s.id === o.storeId)
                  const area = areas.find((a) => a.id === store?.areaId)
                  const cfg = ORDER_STATUS[o.status]
                  return (
                    <tr key={o.id} className={`border-b border-espresso/8 last:border-0 ${selected.has(o.id) ? 'bg-oven-amber/5' : ''}`}>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleSelect(o.id)}>
                          {selected.has(o.id) ? <CheckSquare className="h-4 w-4 text-oven-amber" /> : <Square className="h-4 w-4 text-espresso/40" />}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-medium text-espresso">{store?.dealerName}</td>
                      <td className="px-4 py-3 text-espresso/60">{area?.name}</td>
                      <td className="px-4 py-3 text-espresso/80">{o.product}</td>
                      <td className="px-4 py-3 font-mono text-espresso">{o.quantity}</td>
                      <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 text-xs ${cfg.color}`}><cfg.icon className="h-3.5 w-3.5" />{cfg.label}</span></td>
                      <td className="px-4 py-3 text-espresso/60">{formatDateShort(o.date)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="secondary" onClick={() => setFillOrder(o)}>Fill</Button>
                          <StatusDropdown order={o} onUpdate={(s) => updateOrderStatus(o.id, s)} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
        </div>
      )}

      <AddOrderModal open={addOpen} onClose={() => setAddOpen(false)} areaId={areaId} />
      <FillOrderModal open={!!fillOrder} onClose={() => setFillOrder(null)} order={fillOrder} />
    </div>
  )
}

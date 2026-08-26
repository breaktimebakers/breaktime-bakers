import { useState, useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, MapPin, Search } from 'lucide-react'
import { useAreas, useAllStores, useOrders } from '@/features/sales/hooks'
import { useWorkers } from '@/features/workers/hooks'
import { ORDER_STATUS } from '@/constants/orderStatus'
import { AssignAreasModal } from '../components/AssignAreasModal'
import { Button, EmptyState, PageHeader, SortIcon, inputClass } from '@/components/shared'

export default function OrderTakersList() {
  const { data: workers = [] } = useWorkers()
  const { data: areas = [] } = useAreas()
  const { data: stores = [] } = useAllStores()
  const { data: orders = [], isLoading, isError } = useOrders({ filter: 'all' })
  const orderTakers = useMemo(() => workers.filter((w) => w.roles.includes('marketer')), [workers])
  const [assignPerson, setAssignPerson] = useState(null)

  // Table filter state
  const [otFilter, setOtFilter] = useState('all')
  const [dateMode, setDateMode] = useState('all')
  const [specificDate, setSpecificDate] = useState('')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState('orderDate')
  const [sortDir, setSortDir] = useState('desc')

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const filteredOrders = useMemo(() => {
    let list = orders.map((o) => {
      const store = stores.find((s) => s.id === o.storeId)
      const area = areas.find((a) => a.id === store?.areaId)
      const ot = orderTakers.find((t) => t.id === o.orderTakerId)
      const items = o.items || []
      const productsLabel = items.length === 0 ? '—' : items.length === 1 ? items[0].productName : `${items[0].productName} +${items.length - 1} more`
      const totalQty = items.reduce((s, it) => s + it.quantity, 0)
      return { ...o, storeName: store?.dealerName || '—', areaName: area?.name || '—', otName: ot?.name || '—', productsLabel, totalQty }
    })

    if (otFilter !== 'all') list = list.filter((o) => o.orderTakerId === otFilter)
    if (statusFilter !== 'all') list = list.filter((o) => o.status === statusFilter)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((o) =>
        o.storeName.toLowerCase().includes(q) ||
        o.productsLabel.toLowerCase().includes(q) ||
        o.otName.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q)
      )
    }
    if (dateMode === 'today') list = list.filter((o) => o.orderDate === new Date().toISOString().slice(0, 10))
    if (dateMode === 'week') list = list.filter((o) => { const d = new Date(o.orderDate); return (new Date() - d) / 86400000 <= 7 })
    if (dateMode === 'specific' && specificDate) list = list.filter((o) => o.orderDate === specificDate)
    if (dateMode === 'custom') {
      if (customFrom) list = list.filter((o) => o.orderDate >= customFrom)
      if (customTo) list = list.filter((o) => o.orderDate <= customTo)
    }

    list.sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey]
      if (sortKey === 'totalQty') { av = Number(av) || 0; bv = Number(bv) || 0 }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })

    return list
  }, [orders, stores, areas, orderTakers, otFilter, statusFilter, search, dateMode, specificDate, customFrom, customTo, sortKey, sortDir])

  const clearFilters = () => {
    setOtFilter('all'); setDateMode('all'); setSpecificDate(''); setCustomFrom(''); setCustomTo(''); setStatusFilter('all'); setSearch('')
  }
  const anyFilter = otFilter !== 'all' || dateMode !== 'all' || statusFilter !== 'all' || search

  const columns = [
    { key: 'id', label: 'Order ID' },
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
      <PageHeader eyebrow="Sales / Order takers" title="Order Takers" description="Field sales reps, their assigned territories, and a full breakdown of their orders." />

      {/* Cards */}
      {orderTakers.length === 0 ? (
        <EmptyState icon={Search} title="No order takers yet" description="Give a worker the marketer role to see them here." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {orderTakers.map((ot) => {
            const count = orders.filter((o) => o.orderTakerId === ot.id).length
            const assignedAreas = areas.filter((a) => (ot.assignedAreaIds || []).includes(a.id))
            return (
              <div key={ot.id} className="rounded-bakery border border-espresso/8 bg-proof-cream p-5 shadow-bakery">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-oven-amber/15 font-mono text-sm font-semibold text-oven-amber">
                    {ot.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-lg font-semibold text-espresso">{ot.name}</h3>
                    <p className="text-xs text-espresso/50">{count} total {count === 1 ? 'order' : 'orders'}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {assignedAreas.map((a) => (
                    <span key={a.id} className="inline-flex items-center gap-1 rounded-full bg-espresso/5 px-2.5 py-1 text-xs text-espresso/70"><MapPin className="h-3 w-3" />{a.name}</span>
                  ))}
                  {assignedAreas.length === 0 && <span className="text-xs text-espresso/40">No areas assigned</span>}
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Link to="/sales/orders/order-takers/$personId" params={{ personId: ot.id }}>
                    <Button size="sm" variant="secondary">View detail</Button>
                  </Link>
                  <Button size="sm" variant="ghost" onClick={() => setAssignPerson(ot)}>Assign areas</Button>
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
            <p className="text-xs text-espresso/50">{filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'}</p>
            {anyFilter && <button onClick={clearFilters} className="text-xs text-oven-amber hover:underline">Clear filters</button>}
          </div>
        </div>

        {isLoading ? (
          <p className="px-1 py-8 text-center text-sm text-espresso/40">Loading orders...</p>
        ) : isError ? (
          <EmptyState icon={Search} title="Could not load orders" description="Something went wrong fetching orders. Try refreshing." />
        ) : filteredOrders.length === 0 ? (
          <EmptyState icon={Search} title="No orders found" description="Try adjusting your filters." />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-hidden rounded-bakery border border-espresso/8 bg-proof-cream shadow-bakery md:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="border-b border-espresso/10 bg-crust/30 text-left">
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
                    {filteredOrders.map((o) => {
                      const sc = ORDER_STATUS[o.status]
                      return (
                        <tr key={o.id} className="border-b border-espresso/8 last:border-0 hover:bg-crust/20">
                          <td className="px-4 py-3 font-mono text-xs text-espresso/60">{o.id}</td>
                          <td className="px-4 py-3 font-medium text-espresso">{o.otName}</td>
                          <td className="px-4 py-3 text-espresso/80">{o.storeName}</td>
                          <td className="px-4 py-3 text-espresso/60">{o.areaName}</td>
                          <td className="px-4 py-3 text-espresso/80">{o.productsLabel}</td>
                          <td className="px-4 py-3 font-mono text-espresso">{o.totalQty}</td>
                          <td className="px-4 py-3"><span className={`text-xs font-medium capitalize ${sc.color}`}>{sc.label}</span></td>
                          <td className="px-4 py-3 text-espresso/60">{new Date(o.orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile cards */}
            <div className="grid gap-3 md:hidden">
              {filteredOrders.map((o) => {
                const sc = ORDER_STATUS[o.status]
                return (
                  <div key={o.id} className="rounded-bakery border border-espresso/8 bg-proof-cream p-4 shadow-bakery">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-espresso">{o.storeName}</p>
                        <p className="text-xs text-espresso/50">{o.areaName} · {o.otName}</p>
                      </div>
                      <span className={`text-xs font-medium capitalize ${sc.color}`}>{sc.label}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-espresso/70">{o.productsLabel}</span>
                      <span className="font-mono text-espresso">{o.totalQty} units</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-espresso/45">
                      <span className="font-mono">{o.id}</span>
                      <span>{new Date(o.orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      <AssignAreasModal open={!!assignPerson} onClose={() => setAssignPerson(null)} person={assignPerson} />
    </div>
  )
}

import { useState, useMemo } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { MapPin, Plus, ClipboardList, Calendar, ShoppingBag, Search } from 'lucide-react'
import { useAreas, useAllStores, useOrders } from '@/features/sales/hooks'
import { useWorker } from '@/features/workers/hooks'
import { ORDER_STATUS } from '@/constants/orderStatus'
import { AddPersonOrderModal } from '../components/AddPersonOrderModal'
import { Button, EmptyState, PageHeader, Pagination, SortIcon, StatCard, inputClass } from '@/components/shared'
import { usePagination } from '@/hooks'

const chartColors = ['#C97A2B', '#E8D5B7', '#8C9A6B', '#7A4A5C', '#D4A24C', '#B5C4A8']
const PAGE_SIZE = 8

export default function OrderTakerDetail() {
  const { personId } = useParams({ strict: false })
  const { data: person, isLoading: personLoading, isError: personError } = useWorker(personId)
  const { data: areas = [] } = useAreas()
  const { data: stores = [] } = useAllStores()
  // Scoped server-side to this order taker - not the full order history
  // filtered client-side.
  const { data: personOrders = [] } = useOrders({ filter: 'all', orderTakerId: personId })
  const [range, setRange] = useState('7')
  const [addOpen, setAddOpen] = useState(false)

  // Table filter state
  const [dateMode, setDateMode] = useState('all')
  const [specificDate, setSpecificDate] = useState('')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState('orderDate')
  const [sortDir, setSortDir] = useState('desc')

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  // Every hook below runs unconditionally on every render - person is
  // undefined during the loading state, so each memo guards for that
  // rather than the component early-returning before them (see
  // WorkerDetail.jsx for the same reasoning).
  const assignedAreas = useMemo(() => areas.filter((a) => (person?.assignedAreaIds || []).includes(a.id)), [areas, person])

  const weekOrders = useMemo(() => personOrders.filter((o) => { const d = new Date(o.orderDate); return (new Date() - d) / 86400000 <= 7 }), [personOrders])

  const topProduct = useMemo(() => {
    const counts = {}
    personOrders.forEach((o) => (o.items || []).forEach((it) => { counts[it.productName] = (counts[it.productName] || 0) + it.quantity }))
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'
  }, [personOrders])

  const barData = useMemo(() => {
    const days = parseInt(range)
    const out = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const label = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
      const dateStr = d.toISOString().slice(0, 10)
      const count = personOrders.filter((o) => o.orderDate === dateStr).length
      out.push({ day: label, orders: count })
    }
    return out
  }, [personOrders, range])

  const pieData = useMemo(() => {
    const counts = {}
    personOrders.forEach((o) => {
      const store = stores.find((s) => s.id === o.storeId)
      const name = store?.dealerName || 'Unknown'
      counts[name] = (counts[name] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [personOrders, stores])
  const totalPie = pieData.reduce((s, d) => s + d.value, 0) || 1

  // Table data with filters + sort
  const filteredOrders = useMemo(() => {
    let list = personOrders.map((o) => {
      const store = stores.find((s) => s.id === o.storeId)
      const area = areas.find((a) => a.id === store?.areaId)
      const items = o.items || []
      const productsLabel = items.length === 0 ? '—' : items.length === 1 ? items[0].productName : `${items[0].productName} +${items.length - 1} more`
      const totalQty = items.reduce((s, it) => s + it.quantity, 0)
      return { ...o, storeName: store?.dealerName || '—', areaName: area?.name || '—', productsLabel, totalQty }
    })
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((o) => o.storeName.toLowerCase().includes(q) || o.productsLabel.toLowerCase().includes(q) || o.id.toLowerCase().includes(q))
    }
    if (statusFilter !== 'all') list = list.filter((o) => o.status === statusFilter)
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
  }, [personOrders, stores, areas, search, statusFilter, dateMode, specificDate, customFrom, customTo, sortKey, sortDir])

  const { page, setPage, totalPages, start, end } = usePagination(filteredOrders.length, PAGE_SIZE)
  const paged = filteredOrders.slice(start, end)

  const clearTableFilters = () => { setDateMode('all'); setSpecificDate(''); setCustomFrom(''); setCustomTo(''); setStatusFilter('all'); setSearch('') }
  const anyTableFilter = dateMode !== 'all' || statusFilter !== 'all' || search

  const columns = [
    { key: 'storeName', label: 'Store' },
    { key: 'areaName', label: 'Area' },
    { key: 'productsLabel', label: 'Products' },
    { key: 'totalQty', label: 'Qty' },
    { key: 'status', label: 'Status' },
    { key: 'orderDate', label: 'Date' },
  ]

  if (personLoading) return <p className="px-1 py-8 text-center text-sm text-espresso/40">Loading order taker…</p>
  if (personError || !person) return <EmptyState icon={ClipboardList} title="Order taker not found" description="This person does not exist." />

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-espresso/50">
        <Link to="/sales/orders" className="hover:text-oven-amber">Orders</Link><span>/</span>
        <Link to="/sales/orders/order-takers" className="hover:text-oven-amber">Order takers</Link><span>/</span>
        <span className="text-espresso">{person.name}</span>
      </div>

      <PageHeader eyebrow="Sales / Order taker" title={person.name} description={`${assignedAreas.length} assigned ${assignedAreas.length === 1 ? 'area' : 'areas'}`} actions={<Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" /> Add order on behalf</Button>} />

      <div className="mb-4 flex flex-wrap gap-1.5">
        {assignedAreas.map((a) => (
          <span key={a.id} className="inline-flex items-center gap-1 rounded-full bg-espresso/5 px-2.5 py-1 text-xs text-espresso/70"><MapPin className="h-3 w-3" />{a.name}</span>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard label="Total orders" value={personOrders.length} icon={ClipboardList} chipColor="bg-sourdough/50 text-espresso" />
        <StatCard label="Orders this week" value={weekOrders.length} icon={Calendar} chipColor="bg-olive-herb/30 text-olive-herb" />
        <StatCard label="Most ordered product" value={topProduct} icon={ShoppingBag} chipColor="bg-oven-amber/15 text-oven-amber" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2 sm:gap-6">
        <div className="rounded-bakery border border-espresso/8 bg-proof-cream p-5 shadow-bakery">
          <div className="flex items-center justify-between">
            <div><h3 className="font-display text-lg font-semibold text-espresso">Orders per day</h3><p className="text-xs text-espresso/50">Recent activity</p></div>
            <div className="inline-flex rounded-full bg-crust p-0.5">
              {[7, 30].map((r) => <button key={r} onClick={() => setRange(String(r))} className={`rounded-full px-3 py-1 text-xs font-medium transition ${range === String(r) ? 'bg-espresso text-crust' : 'text-espresso/60'}`}>{r}d</button>)}
            </div>
          </div>
          <div className="mt-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,42,33,0.08)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'rgba(59,42,33,0.5)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11, fill: 'rgba(59,42,33,0.5)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid rgba(59,42,33,0.1)', fontSize: 12 }} cursor={{ fill: 'rgba(201,122,43,0.08)' }} />
                <Bar dataKey="orders" fill="#C97A2B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-bakery border border-espresso/8 bg-proof-cream p-5 shadow-bakery">
          <h3 className="font-display text-lg font-semibold text-espresso">Orders by store</h3>
          <p className="text-xs text-espresso/50">Distribution across stores</p>
          <div className="mt-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2}>
                  {pieData.map((_, i) => <Cell key={i} fill={chartColors[i % chartColors.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => `${v} orders`} contentStyle={{ borderRadius: 10, border: '1px solid rgba(59,42,33,0.1)', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: chartColors[i % chartColors.length] }} />
                <span className="truncate text-espresso/60">{d.name}</span>
                <span className="ml-auto font-mono text-espresso/80">{Math.round((d.value / totalPie) * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Orders table */}
      <div className="mt-8">
        <h2 className="mb-3 font-display text-xl font-semibold text-espresso">Orders by {person.name}</h2>

        {/* Filter bar */}
        <div className="mb-4 flex flex-col gap-3 rounded-bakery border border-espresso/8 bg-proof-cream p-4 shadow-bakery">
          <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
            <div className="relative flex-1 lg:min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-espresso/30" />
              <input className={`${inputClass} pl-9`} placeholder="Search store, product..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
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
            {anyTableFilter && <button onClick={clearTableFilters} className="text-xs text-oven-amber hover:underline">Clear filters</button>}
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <EmptyState icon={Search} title="No orders found" description="Try adjusting your filters." />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-hidden rounded-bakery border border-espresso/8 bg-proof-cream shadow-bakery md:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
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
                    {paged.map((o) => {
                      const sc = ORDER_STATUS[o.status]
                      return (
                        <tr key={o.id} className="border-b border-espresso/8 last:border-0 hover:bg-crust/20">
                          <td className="px-4 py-3 font-medium text-espresso">{o.storeName}</td>
                          <td className="px-4 py-3 text-espresso/60">{o.areaName}</td>
                          <td className="px-4 py-3 text-espresso/80">{o.productsLabel}</td>
                          <td className="px-4 py-3 font-mono text-espresso">{o.totalQty}</td>
                          <td className="px-4 py-3"><span className={`text-xs font-medium ${sc.color}`}>{sc.label}</span></td>
                          <td className="px-4 py-3 text-espresso/60">{new Date(o.orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={filteredOrders.length} pageSize={PAGE_SIZE} />
            </div>

            {/* Mobile cards */}
            <div className="grid gap-3 md:hidden">
              {paged.map((o) => {
                const sc = ORDER_STATUS[o.status]
                return (
                  <div key={o.id} className="rounded-bakery border border-espresso/8 bg-proof-cream p-4 shadow-bakery">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-espresso">{o.storeName}</p>
                        <p className="text-xs text-espresso/50">{o.areaName}</p>
                      </div>
                      <span className={`text-xs font-medium ${sc.color}`}>{sc.label}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-espresso/70">{o.productsLabel}</span>
                      <span className="font-mono text-espresso">{o.totalQty} units</span>
                    </div>
                    <div className="mt-1 text-xs text-espresso/45">
                      <span>{new Date(o.orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                )
              })}
              <div className="rounded-bakery border border-espresso/8 bg-proof-cream shadow-bakery">
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={filteredOrders.length} pageSize={PAGE_SIZE} />
              </div>
            </div>
          </>
        )}
      </div>

      <AddPersonOrderModal open={addOpen} onClose={() => setAddOpen(false)} person={person} />
    </div>
  )
}

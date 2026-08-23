import { useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { Layers, AlertTriangle, PackageCheck, Boxes } from 'lucide-react'
import { useInventory, useRawMaterials } from '@/features/inventory/hooks'
import { PageHeader } from '@/components/shared'

const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN')

function StatCard({ label, value, icon: Icon, chipColor, detail, danger }) {
  return (
    <div className={`rounded-bakery border bg-proof-cream p-4 shadow-bakery transition-all hover:-translate-y-0.5 hover:shadow-bakery-lg sm:p-5 ${danger ? 'border-cherry-compote/30' : 'border-espresso/8'}`}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-wider text-espresso/50">{label}</p>
          <p className={`mt-1.5 font-mono text-2xl font-bold sm:text-3xl ${danger ? 'text-cherry-compote' : 'text-espresso'}`}>{value}</p>
          {detail && <p className="mt-1 text-xs text-espresso/50">{detail}</p>}
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-bakery ${chipColor}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

const chartColors = ['#C97A2B', '#E8D5B7', '#8C9A6B', '#7A4A5C', '#D4A24C', '#B5C4A8', '#A83A3A', '#6B8A5C']

export default function InventoryDashboard() {
  const { batches, readyStock } = useInventory()
  const { data: rawMaterials = [] } = useRawMaterials()
  const [view, setView] = useState('ready')

  const lowStock = rawMaterials.filter((m) => m.stockQty < m.lowStockAt)
  const thisWeekBatches = batches.filter((b) => {
    const d = new Date(b.date)
    const diff = (new Date() - d) / 86400000
    return diff <= 7
  })

  const readyValue = readyStock.reduce((s, r) => s + r.availableQty * r.pricePerUnit, 0)
  const rawValue = rawMaterials.reduce((s, m) => s + m.stockQty * (m.nextLotRate || 0), 0)

  const barData = (() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const label = d.toLocaleDateString('en-IN', { weekday: 'short' })
      const total = batches.filter((b) => b.date === d.toISOString().slice(0, 10)).reduce((s, b) => s + b.quantityProduced, 0)
      days.push({ day: label, qty: total })
    }
    return days
  })()

  const pieData = readyStock.map((r) => ({ name: r.productName, value: r.availableQty }))
  const totalPie = pieData.reduce((s, d) => s + d.value, 0)

  const valueRows = view === 'ready'
    ? readyStock.map((r) => ({ name: r.productName, qty: r.availableQty, price: r.pricePerUnit, value: r.availableQty * r.pricePerUnit })).sort((a, b) => b.value - a.value)
    : rawMaterials.map((m) => ({ name: m.name, qty: m.stockQty, price: m.nextLotRate || 0, value: m.stockQty * (m.nextLotRate || 0) })).sort((a, b) => b.value - a.value)
  const maxValue = Math.max(...valueRows.map((r) => r.value), 1)

  return (
    <div>
      <PageHeader eyebrow="Inventory / Overview" title="Bakery Inventory" description="Track raw materials, production batches, and finished goods ready for sale." />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Raw materials tracked" value={rawMaterials.length} icon={Boxes} chipColor="bg-sourdough/50 text-espresso" detail="Active ingredients" />
        <StatCard label="Batches this week" value={thisWeekBatches.length} icon={Layers} chipColor="bg-olive-herb/30 text-olive-herb" detail="Production runs" />
        <StatCard label="Low-stock items" value={lowStock.length} icon={AlertTriangle} chipColor={lowStock.length > 0 ? 'bg-cherry-compote/15 text-cherry-compote' : 'bg-matcha-glaze/20 text-matcha-glaze'} detail={lowStock.length > 0 ? 'Needs restock' : 'All stocked'} danger={lowStock.length > 0} />
        <StatCard label="Ready stock items" value={readyStock.length} icon={PackageCheck} chipColor="bg-oven-amber/15 text-oven-amber" detail="Finished goods" />
      </div>

      {/* Stock valuation */}
      <div className="mt-6 rounded-bakery border border-espresso/8 bg-proof-cream p-5 shadow-bakery sm:mt-8 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-oven-amber">Stock valuation</p>
            <p className="mt-1 font-mono text-3xl font-bold text-espresso sm:text-4xl">{view === 'ready' ? inr(readyValue) : inr(rawValue)}</p>
          </div>
          <div className="inline-flex rounded-full bg-crust p-1">
            <button onClick={() => setView('ready')} className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${view === 'ready' ? 'bg-oven-amber text-espresso' : 'text-espresso/60'}`}>Ready stock</button>
            <button onClick={() => setView('raw')} className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${view === 'raw' ? 'bg-oven-amber text-espresso' : 'text-espresso/60'}`}>Raw materials</button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className={`rounded-bakery border p-3 transition ${view === 'ready' ? 'border-oven-amber/40 bg-oven-amber/5' : 'border-espresso/8 bg-crust/30'}`}>
            <p className="text-xs text-espresso/50">Ready stock value</p>
            <p className="mt-0.5 font-mono text-lg font-bold text-espresso">{inr(readyValue)}</p>
          </div>
          <div className={`rounded-bakery border p-3 transition ${view === 'raw' ? 'border-oven-amber/40 bg-oven-amber/5' : 'border-espresso/8 bg-crust/30'}`}>
            <p className="text-xs text-espresso/50">Raw materials value</p>
            <p className="mt-0.5 font-mono text-lg font-bold text-espresso">{inr(rawValue)}</p>
          </div>
        </div>

        <div className="mt-5 space-y-2.5">
          {valueRows.map((row, i) => (
            <div key={row.name} className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: chartColors[i % chartColors.length] }} />
              <span className="w-32 shrink-0 truncate text-xs text-espresso/70 sm:w-40">{row.name}</span>
              <div className="relative h-5 flex-1 overflow-hidden rounded bg-espresso/5">
                <div
                  className="absolute inset-y-0 left-0 rounded transition-all duration-700 ease-out"
                  style={{ width: `${(row.value / maxValue) * 100}%`, backgroundColor: chartColors[i % chartColors.length], animationDelay: `${i * 60}ms` }}
                />
              </div>
              <span className="hidden shrink-0 font-mono text-xs text-espresso/60 sm:inline">{row.qty} × ₹{row.price}</span>
              <span className="w-20 shrink-0 text-right font-mono text-xs font-semibold text-espresso">{inr(row.value)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2 sm:mt-8 sm:gap-6">
        <div className="rounded-bakery border border-espresso/8 bg-proof-cream p-5 shadow-bakery">
          <h3 className="font-display text-lg font-semibold text-espresso">Ready stock breakdown</h3>
          <p className="text-xs text-espresso/50">Quantity by product</p>
          <div className="mt-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2}>
                  {pieData.map((_, i) => <Cell key={i} fill={chartColors[i % chartColors.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => `${v} units`} contentStyle={{ borderRadius: 10, border: '1px solid rgba(59,42,33,0.1)', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: chartColors[i % chartColors.length] }} />
                <span className="truncate text-espresso/60">{d.name}</span>
                <span className="ml-auto font-mono text-espresso/80">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-bakery border border-espresso/8 bg-proof-cream p-5 shadow-bakery">
          <h3 className="font-display text-lg font-semibold text-espresso">Batches produced</h3>
          <p className="text-xs text-espresso/50">Last 7 days</p>
          <div className="mt-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,42,33,0.08)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'rgba(59,42,33,0.5)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'rgba(59,42,33,0.5)' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => `${v} units`} contentStyle={{ borderRadius: 10, border: '1px solid rgba(59,42,33,0.1)', fontSize: 12 }} cursor={{ fill: 'rgba(201,122,43,0.08)' }} />
                <Bar dataKey="qty" fill="#C97A2B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

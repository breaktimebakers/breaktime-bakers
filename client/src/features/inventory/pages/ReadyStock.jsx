import { useMemo, useState } from 'react'
import { PackageCheck, Croissant, Cookie, Cake, Wheat, LayoutGrid, Table as TableIcon } from 'lucide-react'
import { useReadyStock } from '@/features/inventory/hooks'
import { EmptyState, ExportMenu, PageHeader, inputClass } from '@/components/shared'
import { exportPDF, exportExcel, formatCurrency } from '@/utils'

function ProductIcon({ name }) {
  const lower = (name || '').toLowerCase()
  if (lower.includes('croissant')) return Croissant
  if (lower.includes('cookie')) return Cookie
  if (lower.includes('cake')) return Cake
  if (lower.includes('bread') || lower.includes('bun')) return Wheat
  return PackageCheck
}

export default function ReadyStock() {
  const [filter, setFilter] = useState('today')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [view, setView] = useState('cards')

  const query = useMemo(() => ({
    filter,
    from: filter === 'custom' ? customFrom || undefined : undefined,
    to: filter === 'custom' ? customTo || undefined : undefined,
  }), [filter, customFrom, customTo])

  const { data: readyStock = [], isLoading, isError } = useReadyStock(query)

  const handleExportPDF = () => exportPDF({
    title: 'Ready Stock', subtitle: 'Break Times Bakery',
    columns: ['Product', 'Qty', 'Unit price', 'Value'],
    rows: readyStock.map((r) => [r.name, `${r.availableQty} ${r.unit}`, formatCurrency(r.pricePerUnit), formatCurrency(r.totalValue)]),
    filename: 'ready-stock.pdf',
  })
  const handleExportExcel = () => exportExcel({
    columns: ['Product', 'Qty', 'Unit', 'Unit price', 'Value'],
    rows: readyStock.map((r) => [r.name, r.availableQty, r.unit, r.pricePerUnit || 0, r.totalValue]),
    sheetName: 'Ready Stock', filename: 'ready-stock.xlsx',
  })

  return (
    <div>
      <PageHeader eyebrow="Inventory / Ready stock" title="Ready Stock" description="Finished goods ready for sale and dispatch." actions={
        <ExportMenu onExportPDF={handleExportPDF} onExportExcel={handleExportExcel} />
      } />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {['today', 'week', 'custom'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3.5 py-1.5 text-xs font-medium capitalize transition ${filter === f ? 'bg-espresso text-crust' : 'bg-proof-cream text-espresso/60 hover:bg-sourdough/40'}`}>
            {f === 'today' ? 'Today' : f === 'week' ? 'This Week' : 'Custom Range'}
          </button>
        ))}
        {filter === 'custom' && (
          <div className="flex flex-wrap items-center gap-2">
            <input type="date" className={`${inputClass} max-w-[150px]`} value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
            <span className="text-xs text-espresso/40">to</span>
            <input type="date" className={`${inputClass} max-w-[150px]`} value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
          </div>
        )}
        <div className="ml-auto inline-flex rounded-full bg-crust p-0.5">
          <button onClick={() => setView('cards')} className={`rounded-full p-1.5 ${view === 'cards' ? 'bg-espresso text-crust' : 'text-espresso/60'}`}><LayoutGrid className="h-4 w-4" /></button>
          <button onClick={() => setView('table')} className={`rounded-full p-1.5 ${view === 'table' ? 'bg-espresso text-crust' : 'text-espresso/60'}`}><TableIcon className="h-4 w-4" /></button>
        </div>
      </div>

      {isLoading ? (
        <p className="px-1 py-8 text-center text-sm text-espresso/40">Loading ready stock…</p>
      ) : isError ? (
        <EmptyState icon={PackageCheck} title="Could not load ready stock" description="Something went wrong fetching finished goods. Try refreshing." />
      ) : readyStock.length === 0 ? (
        <EmptyState icon={PackageCheck} title="No ready stock" description="Finished goods will appear here after production batches are added." />
      ) : view === 'cards' ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {readyStock.map((r) => {
            const Icon = ProductIcon(r.name)
            return (
              <div key={r.id} className="relative overflow-hidden rounded-bakery border border-espresso/8 bg-proof-cream p-5 shadow-bakery transition-all hover:shadow-bakery-lg">
                <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-oven-amber/12" />
                <div className="relative flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-bakery bg-sourdough/40 text-espresso">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="stamp text-matcha-glaze">Ready</span>
                </div>
                <h3 className="relative mt-4 font-display text-lg font-semibold text-espresso">{r.name}</h3>
                <div className="relative mt-1 flex items-baseline gap-1.5">
                  <span className="font-mono text-2xl font-bold text-espresso">{r.availableQty}</span>
                  <span className="text-sm text-espresso/50">{r.unit}</span>
                </div>
                <p className="relative mt-1 font-mono text-xs text-espresso/50">{formatCurrency(r.pricePerUnit)} per {r.unit} · {formatCurrency(r.totalValue)} total</p>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-bakery border border-espresso/8 bg-proof-cream shadow-bakery">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b border-espresso/10 bg-crust/30 text-left">
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Product</th>
                  <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-espresso/50">Qty</th>
                  <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-espresso/50">Unit price</th>
                  <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-espresso/50">Value</th>
                </tr>
              </thead>
              <tbody>
                {readyStock.map((r) => (
                  <tr key={r.id} className="border-b border-espresso/8 last:border-0 hover:bg-crust/20">
                    <td className="px-4 py-3 font-medium text-espresso">{r.name}</td>
                    <td className="px-4 py-3 text-right font-mono text-espresso">{r.availableQty} {r.unit}</td>
                    <td className="px-4 py-3 text-right font-mono text-espresso/60">{formatCurrency(r.pricePerUnit)}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-espresso">{formatCurrency(r.totalValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

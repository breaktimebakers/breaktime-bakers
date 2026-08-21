import { useState } from 'react'
import { Printer, PackageCheck, Croissant, Cookie, Cake, Wheat, LayoutGrid, Table as TableIcon } from 'lucide-react'
import { useInventory } from '@/features/inventory/hooks'
import { Button, EmptyState, PageHeader } from '@/components/shared'

function ProductIcon({ name }) {
  const lower = (name || '').toLowerCase()
  if (lower.includes('croissant')) return Croissant
  if (lower.includes('cookie')) return Cookie
  if (lower.includes('cake')) return Cake
  if (lower.includes('bread') || lower.includes('bun')) return Wheat
  return PackageCheck
}

const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN')

export default function ReadyStock() {
  const { readyStock, lastChanged } = useInventory()
  const [filter, setFilter] = useState('week')
  const [view, setView] = useState('cards')

  return (
    <div>
      <PageHeader eyebrow="Inventory / Ready stock" title="Ready Stock" description="Finished goods ready for sale and dispatch." actions={
        <Button variant="secondary" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print report</Button>
      } />

      <div className="no-print mb-5 flex flex-wrap items-center gap-2">
        {['today', 'week', 'custom'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3.5 py-1.5 text-xs font-medium capitalize transition ${filter === f ? 'bg-espresso text-crust' : 'bg-proof-cream text-espresso/60 hover:bg-sourdough/40'}`}>
            {f === 'today' ? 'Today' : f === 'week' ? 'This Week' : 'Custom Range'}
          </button>
        ))}
        <div className="ml-auto inline-flex rounded-full bg-crust p-0.5">
          <button onClick={() => setView('cards')} className={`rounded-full p-1.5 ${view === 'cards' ? 'bg-espresso text-crust' : 'text-espresso/60'}`}><LayoutGrid className="h-4 w-4" /></button>
          <button onClick={() => setView('table')} className={`rounded-full p-1.5 ${view === 'table' ? 'bg-espresso text-crust' : 'text-espresso/60'}`}><TableIcon className="h-4 w-4" /></button>
        </div>
      </div>

      {readyStock.length === 0 ? (
        <EmptyState icon={PackageCheck} title="No ready stock" description="Finished goods will appear here after production batches are added." />
      ) : view === 'cards' ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {readyStock.map((r) => {
            const Icon = ProductIcon(r.productName)
            const flashClass = lastChanged['rs-' + r.productName] === 'amber' ? 'animate-flash-amber' : ''
            return (
              <div key={r.productName} className={`relative overflow-hidden rounded-bakery border border-espresso/8 bg-proof-cream p-5 shadow-bakery transition-all hover:shadow-bakery-lg ${flashClass}`}>
                <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-oven-amber/12" />
                <div className="relative flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-bakery bg-sourdough/40 text-espresso">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="stamp text-matcha-glaze">Ready</span>
                </div>
                <h3 className="relative mt-4 font-display text-lg font-semibold text-espresso">{r.productName}</h3>
                <div className="relative mt-1 flex items-baseline gap-1.5">
                  <span className="font-mono text-2xl font-bold text-espresso">{r.availableQty}</span>
                  <span className="text-sm text-espresso/50">{r.unit}</span>
                </div>
                <p className="relative mt-1 font-mono text-xs text-espresso/50">{inr(r.pricePerUnit)} per {r.unit}</p>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="no-print overflow-hidden rounded-bakery border border-espresso/8 bg-proof-cream shadow-bakery">
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
                {readyStock.map((r) => {
                  const flashClass = lastChanged['rs-' + r.productName] === 'amber' ? 'animate-flash-amber' : ''
                  return (
                    <tr key={r.productName} className="border-b border-espresso/8 last:border-0 hover:bg-crust/20">
                      <td className="px-4 py-3 font-medium text-espresso">{r.productName}</td>
                      <td className={`px-4 py-3 text-right font-mono text-espresso ${flashClass}`}>{r.availableQty} {r.unit}</td>
                      <td className="px-4 py-3 text-right font-mono text-espresso/60">{inr(r.pricePerUnit)}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-espresso">{inr(r.availableQty * r.pricePerUnit)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="print-only mt-6">
        <h2 className="font-display text-xl">Ready Stock Report — Break Times Bakery</h2>
        <p>{new Date().toLocaleDateString('en-IN')}</p>
        <table className="mt-4 w-full border-collapse text-sm">
          <thead>
            <tr><th className="border border-espresso/20 p-2 text-left">Product</th><th className="border border-espresso/20 p-2 text-right">Qty</th><th className="border border-espresso/20 p-2 text-right">Unit price</th><th className="border border-espresso/20 p-2 text-right">Value</th></tr>
          </thead>
          <tbody>
            {readyStock.map((r) => (
              <tr key={r.productName}>
                <td className="border border-espresso/20 p-2">{r.productName}</td>
                <td className="border border-espresso/20 p-2 text-right">{r.availableQty} {r.unit}</td>
                <td className="border border-espresso/20 p-2 text-right">{inr(r.pricePerUnit)}</td>
                <td className="border border-espresso/20 p-2 text-right">{inr(r.availableQty * r.pricePerUnit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

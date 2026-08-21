import { useState, useMemo } from 'react'
import { Search, Pencil, Plus, Trash2, PackagePlus, ChevronDown, AlertTriangle } from 'lucide-react'
import { useInventory } from '@/features/inventory/hooks'
import { Button, EmptyState, ExportMenu, PageHeader, inputClass } from '@/components/shared'
import { exportPDF, exportExcel, formatCurrency } from '@/utils'
import { AddMaterialModal } from '../components/AddMaterialModal'
import { EditMaterialModal } from '../components/EditMaterialModal'
import { RestockModal } from '../components/RestockModal'

export default function RawMaterials() {
  const { rawMaterials, lastChanged, deleteRawMaterial } = useInventory()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState(null)
  const [addOpen, setAddOpen] = useState(false)
  const [editMat, setEditMat] = useState(null)
  const [restockMat, setRestockMat] = useState(null)
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const filtered = useMemo(() => {
    let list = rawMaterials
    if (search) list = list.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()))
    if (filter === 'low') list = list.filter((m) => m.stockQty < m.lowStockAt)
    if (filter === 'custom' && (customFrom || customTo)) {
      list = list.filter((m) => {
        if (customFrom && m.lots[0]?.purchaseDate < customFrom) return false
        if (customTo && m.lots[0]?.purchaseDate > customTo) return false
        return true
      })
    }
    return list
  }, [rawMaterials, search, filter, customFrom, customTo])

  const handleExportPDF = () => {
    exportPDF({
      title: 'Raw Materials',
      subtitle: 'Break Times Bakery',
      columns: ['Material', 'Unit', 'Stock', 'Low-stock at', 'First lot rate'],
      rows: filtered.map((m) => [m.name, m.unit, m.stockQty, m.lowStockAt, formatCurrency(m.lots[0]?.unitCost || 0)]),
      filename: 'raw-materials.pdf',
    })
  }
  const handleExportExcel = () => {
    exportExcel({
      columns: ['Material', 'Unit', 'Stock', 'Low-stock at', 'First lot rate'],
      rows: filtered.map((m) => [m.name, m.unit, m.stockQty, m.lowStockAt, m.lots[0]?.unitCost || 0]),
      sheetName: 'Raw Materials',
      filename: 'raw-materials.xlsx',
    })
  }

  return (
    <div>
      <PageHeader eyebrow="Inventory / Raw materials" title="Raw Materials" description="Manage ingredient stock, purchase lots, and restock alerts." actions={<>
        <ExportMenu onExportPDF={handleExportPDF} onExportExcel={handleExportExcel} />
        <Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" /> Add raw material</Button>
      </>} />

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 rounded-bakery border border-espresso/8 bg-proof-cream p-4 shadow-bakery">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-espresso/30" />
            <input className={`${inputClass} pl-9`} placeholder="Search materials..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {['all', 'low', 'custom'].map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition ${filter === f ? 'bg-espresso text-crust' : 'bg-crust/50 text-espresso/60 hover:bg-crust'}`}>
                {f === 'all' ? 'All' : f === 'low' ? 'Low Stock' : 'Custom Range'}
              </button>
            ))}
          </div>
        </div>
        {filter === 'custom' && (
          <div className="flex flex-wrap items-center gap-2">
            <input type="date" className={`${inputClass} max-w-[160px]`} value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
            <span className="text-xs text-espresso/40">to</span>
            <input type="date" className={`${inputClass} max-w-[160px]`} value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
          </div>
        )}
        <p className="text-xs text-espresso/50">{filtered.length} {filtered.length === 1 ? 'item' : 'items'}</p>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={PackagePlus} title="No materials found" description="Try adjusting your search or filters." />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-bakery border border-espresso/8 bg-proof-cream shadow-bakery md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-espresso/10 bg-crust/30 text-left">
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Material</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Unit</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">First lot rate</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Current stock</th>
                  <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-espresso/50">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => {
                  const isLow = m.stockQty < m.lowStockAt
                  const flashClass = lastChanged[m.id] === 'green' ? 'animate-flash' : ''
                  return (
                    <>
                      <tr key={m.id} className={`border-b border-espresso/8 transition ${flashClass}`}>
                        <td className="px-4 py-3">
                          <button onClick={() => setExpanded(expanded === m.id ? null : m.id)} className="flex items-center gap-2 text-left font-medium text-espresso">
                            <ChevronDown className={`h-4 w-4 transition-transform ${expanded === m.id ? 'rotate-180' : ''} text-espresso/40`} />
                            {m.name}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-espresso/60">{m.unit}</td>
                        <td className="px-4 py-3 font-mono text-espresso/80">{formatCurrency(m.lots[0]?.unitCost || 0)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`font-mono font-semibold ${isLow ? 'text-cherry-compote' : 'text-espresso'}`}>{m.stockQty}</span>
                            {isLow && <span className="flex items-center gap-1 text-[10px] text-cherry-compote"><AlertTriangle className="h-3 w-3" /> Below reorder</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <button onClick={() => setEditMat(m)} className="flex h-8 w-8 items-center justify-center rounded-lg text-espresso/60 hover:bg-espresso/5 hover:text-espresso" title="Edit"><Pencil className="h-4 w-4" /></button>
                            <button onClick={() => setRestockMat(m)} className="flex h-8 w-8 items-center justify-center rounded-lg text-matcha-glaze hover:bg-matcha-glaze/10" title="Restock"><PackagePlus className="h-4 w-4" /></button>
                            <button onClick={() => deleteRawMaterial(m.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-cherry-compote hover:bg-cherry-compote/10" title="Delete"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                      {expanded === m.id && (
                        <tr className="bg-crust/20">
                          <td colSpan={5} className="px-4 py-4">
                            <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Purchase history</p>
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-left text-espresso/40">
                                    <th className="py-1.5 pr-4">Date</th>
                                    <th className="py-1.5 pr-4">Vendor</th>
                                    <th className="py-1.5 pr-4">Rate</th>
                                    <th className="py-1.5 pr-4">Remaining qty</th>
                                    <th className="py-1.5 pr-4">Receipt</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {[...m.lots].sort((a, b) => new Date(a.purchaseDate) - new Date(b.purchaseDate)).map((lot, i) => (
                                    <tr key={lot.id} className="border-t border-espresso/5">
                                      <td className="py-2 pr-4 text-espresso/70">{new Date(lot.purchaseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                      <td className="py-2 pr-4 text-espresso/70">{lot.vendor || '—'}</td>
                                      <td className="py-2 pr-4 font-mono text-espresso/80">{formatCurrency(lot.unitCost)}</td>
                                      <td className="py-2 pr-4 font-mono text-espresso/80">{lot.quantity} {m.unit}</td>
                                      <td className="py-2 pr-4 text-espresso/50">{lot.receiptName || '—'}</td>
                                      <td className="py-2 pr-4">
                                        {i === 0 && <span className="rounded bg-oven-amber/15 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-oven-amber">FIFO next</span>}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="grid gap-3 md:hidden">
            {filtered.map((m) => {
              const isLow = m.stockQty < m.lowStockAt
              const flashClass = lastChanged[m.id] === 'green' ? 'animate-flash' : ''
              return (
                <div key={m.id} className={`rounded-bakery border border-espresso/8 bg-proof-cream p-4 shadow-bakery ${flashClass}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-espresso">{m.name}</p>
                      <p className="text-xs text-espresso/50">per {m.unit} · first lot {formatCurrency(m.lots[0]?.unitCost || 0)}</p>
                    </div>
                    <span className={`font-mono text-xl font-bold ${isLow ? 'text-cherry-compote' : 'text-espresso'}`}>{m.stockQty}</span>
                  </div>
                  {isLow && <p className="mt-1 flex items-center gap-1 text-[10px] text-cherry-compote"><AlertTriangle className="h-3 w-3" /> Below reorder level</p>}
                  <div className="mt-3 flex items-center gap-1.5">
                    <button onClick={() => setEditMat(m)} className="flex items-center gap-1 rounded-lg bg-espresso/5 px-2.5 py-1.5 text-xs text-espresso/70"><Pencil className="h-3.5 w-3.5" /> Edit</button>
                    <button onClick={() => setRestockMat(m)} className="flex items-center gap-1 rounded-lg bg-matcha-glaze/10 px-2.5 py-1.5 text-xs text-matcha-glaze"><PackagePlus className="h-3.5 w-3.5" /> Restock</button>
                    <button onClick={() => deleteRawMaterial(m.id)} className="flex items-center gap-1 rounded-lg bg-cherry-compote/10 px-2.5 py-1.5 text-xs text-cherry-compote"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                  </div>
                  <button onClick={() => setExpanded(expanded === m.id ? null : m.id)} className="mt-3 flex w-full items-center justify-center gap-1 border-t border-espresso/8 pt-2 text-xs text-espresso/50">
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded === m.id ? 'rotate-180' : ''}`} />
                    {expanded === m.id ? 'Hide' : 'Show'} purchase history
                  </button>
                  {expanded === m.id && (
                    <div className="mt-2 space-y-1.5">
                      {[...m.lots].sort((a, b) => new Date(a.purchaseDate) - new Date(b.purchaseDate)).map((lot, i) => (
                        <div key={lot.id} className="rounded-lg bg-crust/30 p-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-espresso/70">{new Date(lot.purchaseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                            <span className="font-mono text-espresso/80">{lot.quantity} {m.unit}</span>
                          </div>
                          <div className="flex justify-between text-espresso/50">
                            <span>{lot.vendor || '—'}</span>
                            <span className="font-mono">{formatCurrency(lot.unitCost)}</span>
                          </div>
                          {i === 0 && <span className="mt-1 inline-block rounded bg-oven-amber/15 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-oven-amber">FIFO next</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      <AddMaterialModal open={addOpen} onClose={() => setAddOpen(false)} />
      <EditMaterialModal open={!!editMat} onClose={() => setEditMat(null)} material={editMat} />
      <RestockModal open={!!restockMat} onClose={() => setRestockMat(null)} material={restockMat} />
    </div>
  )
}

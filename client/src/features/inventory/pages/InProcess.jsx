import { useState, useMemo } from 'react'
import { Plus, CookingPot, LayoutGrid, Table as TableIcon } from 'lucide-react'
import { useInventory, useRawMaterials } from '@/features/inventory/hooks'
import { Button, EmptyState, ExportMenu, PageHeader, Pagination, inputClass } from '@/components/shared'
import { usePagination } from '@/hooks'
import { exportPDF, exportExcel } from '@/utils'
import { AddBatchModal } from '../components/AddBatchModal'

const PAGE_SIZE = 6

export default function InProcess() {
  const { batches } = useInventory()
  const { data: rawMaterials = [] } = useRawMaterials()
  const [filter, setFilter] = useState('week')
  const [addOpen, setAddOpen] = useState(false)
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [view, setView] = useState('cards')

  const filtered = useMemo(() => {
    const now = new Date()
    return batches.filter((b) => {
      const d = new Date(b.date)
      const diff = (now - d) / 86400000
      if (filter === 'today') return diff < 1
      if (filter === 'week') return diff <= 7
      if (filter === 'custom') {
        if (customFrom && b.date < customFrom) return false
        if (customTo && b.date > customTo) return false
        return true
      }
      return true
    })
  }, [batches, filter, customFrom, customTo])

  const { page, setPage, totalPages, start, end } = usePagination(filtered.length, PAGE_SIZE)
  const paged = filtered.slice(start, end)

  const handleExportPDF = () => exportPDF({
    title: 'Production Batches', subtitle: 'Break Times Bakery',
    columns: ['Batch ID', 'Date', 'Product', 'Quantity', 'Unit'],
    rows: filtered.map((b) => [b.id, b.date, b.productName, b.quantityProduced, b.unit]),
    filename: 'batches.pdf',
  })
  const handleExportExcel = () => exportExcel({
    columns: ['Batch ID', 'Date', 'Product', 'Quantity', 'Unit'],
    rows: filtered.map((b) => [b.id, b.date, b.productName, b.quantityProduced, b.unit]),
    sheetName: 'Batches', filename: 'batches.xlsx',
  })

  return (
    <div>
      <PageHeader eyebrow="Inventory / In process" title="In Process" description="Production batches and ingredient consumption tickets." actions={<>
        <ExportMenu onExportPDF={handleExportPDF} onExportExcel={handleExportExcel} />
        <Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" /> Add batch</Button>
      </>} />

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

      {filtered.length === 0 ? (
        <EmptyState icon={CookingPot} title="No batches found" description="Add a production batch to see it here." />
      ) : view === 'cards' ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {paged.map((b) => (
              <div key={b.id} className="ticket-edge ticket-edge-bottom relative overflow-hidden rounded-bakery border border-espresso/10 bg-proof-cream p-5 pt-6 shadow-bakery">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display text-lg font-semibold text-espresso">{b.productName}</h3>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-espresso/40">{b.id} · {new Date(b.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <span className="stamp text-matcha-glaze">Produced</span>
                </div>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="font-mono text-3xl font-bold text-espresso">{b.quantityProduced}</span>
                  <span className="text-sm text-espresso/50">{b.unit}</span>
                </div>
                <div className="perforation mt-4 mb-3" />
                <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Ingredients consumed</p>
                <div className="space-y-1">
                  {b.ingredientsUsed.map((ing, i) => {
                    const mat = rawMaterials.find((m) => m.id === ing.rawMaterialId)
                    return (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="text-espresso/70">{mat?.name || 'Unknown'}</span>
                        <span className="font-mono text-espresso/80">{ing.qty} {mat?.unit}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-bakery border border-espresso/8 bg-proof-cream shadow-bakery">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
          </div>
        </>
      ) : (
        <div className="overflow-hidden rounded-bakery border border-espresso/8 bg-proof-cream shadow-bakery">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-espresso/10 bg-crust/30 text-left">
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Batch ID</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Date</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Product</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Quantity</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Unit</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Ingredients</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((b) => (
                  <tr key={b.id} className="border-b border-espresso/8 last:border-0">
                    <td className="px-4 py-3 font-mono text-xs text-espresso/60">{b.id}</td>
                    <td className="px-4 py-3 text-espresso/60">{new Date(b.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td className="px-4 py-3 font-medium text-espresso">{b.productName}</td>
                    <td className="px-4 py-3 font-mono text-espresso">{b.quantityProduced}</td>
                    <td className="px-4 py-3 text-espresso/60">{b.unit}</td>
                    <td className="px-4 py-3 text-xs text-espresso/60">
                      {b.ingredientsUsed.map((ing) => {
                        const mat = rawMaterials.find((m) => m.id === ing.rawMaterialId)
                        return `${mat?.name || '?'} (${ing.qty})`
                      }).join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
        </div>
      )}

      <AddBatchModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}

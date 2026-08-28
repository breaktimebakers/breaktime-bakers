import { useState, useMemo, useEffect } from 'react'
import { Search, Pencil, Plus, Trash2, PackagePlus, ChevronDown, AlertTriangle, FileText } from 'lucide-react'
import {
  useRawMaterials,
  useRawMaterialLots,
  useDeleteRawMaterial,
} from '@/features/inventory/hooks'
import { Button, ConfirmModal, EmptyState, ExportMenu, FileViewerModal, PageHeader, inputClass } from '@/components/shared'
import { exportPDF, exportExcel, formatCurrency, formatDate } from '@/utils'
import { AddMaterialModal } from '../components/AddMaterialModal'
import { EditMaterialModal } from '../components/EditMaterialModal'
import { RestockModal } from '../components/RestockModal'

// A material's lot history is fetched lazily (see LotHistory below), so a
// row that's never been expanded never issues that request.
function LotHistory({ material, onViewReceipt }) {
  const { data: lots = [], isLoading, isError } = useRawMaterialLots(material.id)

  if (isLoading) return <p className="px-4 py-3 text-xs text-espresso/40">Loading purchase history…</p>
  if (isError) return <p className="px-4 py-3 text-xs text-cherry-compote">Could not load purchase history.</p>
  if (lots.length === 0) return <p className="px-4 py-3 text-xs text-espresso/40">No lots purchased this month.</p>

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-espresso/40">
            <th className="py-1.5 pr-4">Date</th>
            <th className="py-1.5 pr-4">Vendor</th>
            <th className="py-1.5 pr-4">Rate</th>
            <th className="py-1.5 pr-4">Quantity</th>
            <th className="py-1.5 pr-4">Receipt</th>
          </tr>
        </thead>
        <tbody>
          {lots.map((lot) => (
            <tr key={lot.id} className="border-t border-espresso/5">
              <td className="py-2 pr-4 text-espresso/70">{formatDate(lot.purchaseDate)}</td>
              <td className="py-2 pr-4 text-espresso/70">{lot.vendorName || '—'}</td>
              <td className="py-2 pr-4 font-mono text-espresso/80">{formatCurrency(lot.unitCost)}</td>
              <td className="py-2 pr-4 font-mono text-espresso/80">{lot.originalQty} {material.unit}</td>
              <td className="py-2 pr-4">
                {lot.receiptUrl ? (
                  <button
                    onClick={() => onViewReceipt({ url: lot.receiptUrl, title: `${material.name} · ${formatDate(lot.purchaseDate)}` })}
                    className="flex items-center gap-1 rounded-lg bg-oven-amber/10 px-2 py-1 text-oven-amber hover:bg-oven-amber/20"
                  >
                    <FileText className="h-3.5 w-3.5" /> View
                  </button>
                ) : (
                  <span className="text-espresso/30">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function RawMaterials() {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState(null)
  const [addOpen, setAddOpen] = useState(false)
  const [editMat, setEditMat] = useState(null)
  const [restockMat, setRestockMat] = useState(null)
  const [deletingMat, setDeletingMat] = useState(null)
  const [viewingReceipt, setViewingReceipt] = useState(null)
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  // Debounced so a search keystroke doesn't fire a request per character
  // - the query still runs staleTime: 0 (see queryClient.js), this just
  // avoids issuing one on every single keystroke.
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  const query = useMemo(() => ({
    search: search || undefined,
    filter,
    from: filter === 'custom' ? customFrom || undefined : undefined,
    to: filter === 'custom' ? customTo || undefined : undefined,
  }), [search, filter, customFrom, customTo])

  const { data: materials = [], isLoading, isError } = useRawMaterials(query)
  const deleteRawMaterial = useDeleteRawMaterial()

  const confirmDelete = async () => {
    try {
      await deleteRawMaterial.mutateAsync(deletingMat.id)
      setDeletingMat(null)
    } catch {
      // Error already surfaced as a toast by useDeleteRawMaterial - leave
      // the confirmation open so the admin can retry or cancel.
    }
  }
  const totalRawMaterialAmount = materials.reduce(
    (total, material) => total + Number(material.stockQty || 0) * Number(material.nextLotRate || 0),
    0,
  )

  const handleExportPDF = () => {
    exportPDF({
      title: 'Raw Materials',
      subtitle: 'Break Times Bakery',
      columns: ['Material', 'Unit', 'Stock', 'Low-stock at', 'Next lot rate', 'Amount'],
      rows: materials.map((m) => {
        const amount = Number(m.stockQty || 0) * Number(m.nextLotRate || 0)
        return [m.name, m.unit, m.stockQty, m.lowStockAt, formatCurrency(m.nextLotRate || 0), formatCurrency(amount)]
      }),
      summaryRows: [{ label: 'Total raw material amount', value: formatCurrency(totalRawMaterialAmount) }],
      filename: 'raw-materials.pdf',
    })
  }
  const handleExportExcel = () => {
    exportExcel({
      title: 'Raw Materials',
      subtitle: 'Break Times Bakery',
      columns: ['Material', 'Unit', 'Stock', 'Low-stock at', 'Next lot rate', 'Amount'],
      rows: materials.map((m) => {
        const rate = Number(m.nextLotRate || 0)
        const amount = Number(m.stockQty || 0) * rate
        return [m.name, m.unit, m.stockQty, m.lowStockAt, rate, amount]
      }),
      summaryRows: [{ label: 'Total raw material amount', value: totalRawMaterialAmount }],
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
            <input className={`${inputClass} pl-9`} placeholder="Search materials..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
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
        <p className="text-xs text-espresso/50">{isLoading ? 'Loading…' : `${materials.length} ${materials.length === 1 ? 'item' : 'items'}`}</p>
      </div>

      {isError ? (
        <EmptyState icon={AlertTriangle} title="Could not load raw materials" description="Something went wrong talking to the server. Try refreshing." />
      ) : !isLoading && materials.length === 0 ? (
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
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Next lot rate</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Current stock</th>
                  <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-espresso/50">Actions</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((m) => {
                  const isLow = m.stockQty < m.lowStockAt
                  return (
                    <>
                      <tr key={m.id} className="border-b border-espresso/8 transition">
                        <td className="px-4 py-3">
                          <button onClick={() => setExpanded(expanded === m.id ? null : m.id)} className="flex items-center gap-2 text-left font-medium text-espresso">
                            <ChevronDown className={`h-4 w-4 transition-transform ${expanded === m.id ? 'rotate-180' : ''} text-espresso/40`} />
                            {m.name}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-espresso/60">{m.unit}</td>
                        <td className="px-4 py-3 font-mono text-espresso/80">{formatCurrency(m.nextLotRate || 0)}</td>
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
                            <button onClick={() => setDeletingMat(m)} className="flex h-8 w-8 items-center justify-center rounded-lg text-cherry-compote hover:bg-cherry-compote/10" title="Delete"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                      {expanded === m.id && (
                        <tr className="bg-crust/20">
                          <td colSpan={5} className="px-4 py-4">
                            <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Purchase history (this month)</p>
                            <LotHistory material={m} onViewReceipt={setViewingReceipt} />
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
            {materials.map((m) => {
              const isLow = m.stockQty < m.lowStockAt
              return (
                <div key={m.id} className="rounded-bakery border border-espresso/8 bg-proof-cream p-4 shadow-bakery">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-espresso">{m.name}</p>
                      <p className="text-xs text-espresso/50">per {m.unit} · next lot {formatCurrency(m.nextLotRate || 0)}</p>
                    </div>
                    <span className={`font-mono text-xl font-bold ${isLow ? 'text-cherry-compote' : 'text-espresso'}`}>{m.stockQty}</span>
                  </div>
                  {isLow && <p className="mt-1 flex items-center gap-1 text-[10px] text-cherry-compote"><AlertTriangle className="h-3 w-3" /> Below reorder level</p>}
                  <div className="mt-3 flex items-center gap-1.5">
                    <button onClick={() => setEditMat(m)} className="flex items-center gap-1 rounded-lg bg-espresso/5 px-2.5 py-1.5 text-xs text-espresso/70"><Pencil className="h-3.5 w-3.5" /> Edit</button>
                    <button onClick={() => setRestockMat(m)} className="flex items-center gap-1 rounded-lg bg-matcha-glaze/10 px-2.5 py-1.5 text-xs text-matcha-glaze"><PackagePlus className="h-3.5 w-3.5" /> Restock</button>
                    <button onClick={() => setDeletingMat(m)} className="flex items-center gap-1 rounded-lg bg-cherry-compote/10 px-2.5 py-1.5 text-xs text-cherry-compote"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                  </div>
                  <button onClick={() => setExpanded(expanded === m.id ? null : m.id)} className="mt-3 flex w-full items-center justify-center gap-1 border-t border-espresso/8 pt-2 text-xs text-espresso/50">
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded === m.id ? 'rotate-180' : ''}`} />
                    {expanded === m.id ? 'Hide' : 'Show'} purchase history
                  </button>
                  {expanded === m.id && (
                    <div className="mt-2">
                      <LotHistory material={m} onViewReceipt={setViewingReceipt} />
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
      <ConfirmModal
        open={!!deletingMat}
        onClose={() => setDeletingMat(null)}
        onConfirm={confirmDelete}
        isLoading={deleteRawMaterial.isPending}
        title="Delete raw material?"
        description={deletingMat ? `"${deletingMat.name}" and its purchase history will be removed from the active list. This can't be undone from here.` : ''}
        confirmLabel="Delete"
      />
      <FileViewerModal
        open={!!viewingReceipt}
        onClose={() => setViewingReceipt(null)}
        fileUrl={viewingReceipt?.url}
        title={viewingReceipt?.title}
        eyebrow="Purchase receipt"
        emptyLabel="No receipt available for this lot."
      />
    </div>
  )
}

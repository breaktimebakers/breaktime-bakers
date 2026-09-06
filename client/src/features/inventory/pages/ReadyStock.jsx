import { useState, useMemo } from 'react'
import { PackageCheck, ChevronDown } from 'lucide-react'
import { useReadyStock, useProductStockHistory } from '@/features/inventory/hooks'
import { readyStockApi } from '@/features/inventory/api/readyStockApi'
import { EmptyState, ErrorState, ExportMenu, PageHeader, inputClass } from '@/components/shared'
import { exportPDF, exportExcel, formatCurrency, formatDate } from '@/utils'
import { toast } from '@/lib/toast'

// A product's incoming stock history is fetched lazily (only once its row
// is expanded), same pattern as LotHistory in RawMaterials.jsx.
function StockHistory({ product }) {
  const { data: history = [], isLoading, isError, isFetching, refetch } = useProductStockHistory(product.id)

  if (isError) return <ErrorState description="Could not load stock history." onRetry={refetch} retrying={isFetching} />
  if (isLoading) return <p className="px-4 py-3 text-xs text-espresso/40">Loading stock history…</p>
  if (history.length === 0) return <p className="px-4 py-3 text-xs text-espresso/40">No batches produced this month.</p>

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-espresso/40">
            <th className="py-1.5 pr-4">Date</th>
            <th className="py-1.5 pr-4">Quantity added</th>
            <th className="py-1.5 pr-4">Price</th>
          </tr>
        </thead>
        <tbody>
          {history.map((h) => (
            <tr key={h.id} className="border-t border-espresso/5">
              <td className="py-2 pr-4 text-espresso/70">{formatDate(h.date)}</td>
              <td className="py-2 pr-4 font-mono text-espresso/80">{h.quantity} {product.unit}</td>
              <td className="py-2 pr-4 font-mono text-espresso/80">{formatCurrency(h.pricePerUnit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function ReadyStock() {
  const [filter, setFilter] = useState('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [expanded, setExpanded] = useState(null)

  const query = useMemo(() => ({
    filter,
    from: filter === 'custom' ? customFrom || undefined : undefined,
    to: filter === 'custom' ? customTo || undefined : undefined,
  }), [filter, customFrom, customTo])

  const { data: readyStock = [], isLoading, isError, isFetching, refetch } = useReadyStock(query)

  // Every listed product's stock history (this month, same default as the
  // expandable row view), fetched fresh at export time rather than reusing
  // whatever a row happens to have cached from being expanded - exporting
  // shouldn't depend on which rows the admin has clicked open.
  const buildStockHistorySection = async () => {
    const perProduct = await Promise.all(
      readyStock.map(async (r) => {
        const { history } = await readyStockApi.history(r.id, {})
        return history.map((h) => [r.name, formatDate(h.date), `${h.quantity} ${r.unit}`, formatCurrency(h.pricePerUnit)])
      }),
    )

    return {
      title: 'Stock History (This Month)',
      columns: ['Product', 'Date', 'Quantity added', 'Price'],
      rows: perProduct.flat(),
    }
  }

  const handleExportPDF = async () => {
    const extraTable = await buildStockHistorySection().catch(() => {
      toast.error('Could not load stock history for export.')
      return undefined
    })

    exportPDF({
      title: 'Ready Stock', subtitle: 'Break Times Bakery',
      columns: ['Product', 'Qty', 'Unit price', 'Value'],
      rows: readyStock.map((r) => [r.name, `${r.availableQty} ${r.unit}`, formatCurrency(r.pricePerUnit), formatCurrency(r.totalValue)]),
      extraTable,
      filename: 'ready-stock.pdf',
    })
  }
  const handleExportExcel = async () => {
    const extraTable = await buildStockHistorySection().catch(() => {
      toast.error('Could not load stock history for export.')
      return undefined
    })

    exportExcel({
      columns: ['Product', 'Qty', 'Unit', 'Unit price', 'Value'],
      rows: readyStock.map((r) => [r.name, r.availableQty, r.unit, r.pricePerUnit || 0, r.totalValue]),
      extraTable,
      sheetName: 'Ready Stock', filename: 'ready-stock.xlsx',
    })
  }

  return (
    <div>
      <PageHeader eyebrow="Inventory / Ready stock" title="Ready Stock" description="Finished goods ready for sale and dispatch." actions={
        <ExportMenu onExportPDF={handleExportPDF} onExportExcel={handleExportExcel} />
      } />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {['all', 'today', 'week', 'custom'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3.5 py-1.5 text-xs font-medium capitalize transition ${filter === f ? 'bg-espresso text-crust' : 'bg-proof-cream text-espresso/60 hover:bg-sourdough/40'}`}>
            {f === 'today' ? 'Today' : f === 'week' ? 'This Week' : f === 'all' ? 'All Stock' : 'Custom Range'}
          </button>
        ))}
        {filter === 'custom' && (
          <div className="flex flex-wrap items-center gap-2">
            <input type="date" className={`${inputClass} max-w-[150px]`} value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
            <span className="text-xs text-espresso/40">to</span>
            <input type="date" className={`${inputClass} max-w-[150px]`} value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
          </div>
        )}
      </div>

      {isError ? (
        <ErrorState description="Could not load ready stock." onRetry={refetch} retrying={isFetching} />
      ) : isLoading ? (
        <p className="px-1 py-8 text-center text-sm text-espresso/40">Loading ready stock…</p>
      ) : readyStock.length === 0 ? (
        <EmptyState icon={PackageCheck} title="No ready stock" description="Finished goods will appear here after production batches are added." />
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
                  <>
                    <tr key={r.id} className="border-b border-espresso/8 last:border-0 hover:bg-crust/20">
                      <td className="px-4 py-3">
                        <button onClick={() => setExpanded(expanded === r.id ? null : r.id)} className="flex items-center gap-2 text-left font-medium text-espresso">
                          <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${expanded === r.id ? 'rotate-180' : ''} text-espresso/40`} />
                          {r.name}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-espresso">{r.availableQty} {r.unit}</td>
                      <td className="px-4 py-3 text-right font-mono text-espresso/60">{formatCurrency(r.pricePerUnit)}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-espresso">{formatCurrency(r.totalValue)}</td>
                    </tr>
                    {expanded === r.id && (
                      <tr className="bg-crust/20">
                        <td colSpan={4} className="px-4 py-4">
                          <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Incoming stock history (this month)</p>
                          <StockHistory product={r} />
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

import { useMemo, useState } from 'react'
import { Truck, Check, ChevronDown } from 'lucide-react'
import { useAllLots, useRawMaterialLots, useUpdateLotPayment } from '@/features/inventory/hooks'
import { EmptyState, ErrorState, PageHeader, StatCard, MonthFilterBar } from '@/components/shared'
import { todayISO } from '@/utils'
import { PaidBadge } from '../components/PaidBadge'
import { FragmentRow } from '../components/FragmentRow'
import { ExpandedHistory } from '../components/ExpandedHistory'

const monthRangeISO = (year, month) => {
  const from = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const lastDay = new Date(year, month + 1, 0).getDate()
  const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return { from, to }
}

const toRow = (lot, overrides = {}) => ({
  lotId: lot.id,
  rawMaterialId: lot.rawMaterialId,
  vendor: lot.vendorName || 'Unknown vendor',
  materialName: overrides.materialName ?? lot.materialName,
  quantity: lot.originalQty,
  unit: overrides.unit ?? lot.unit,
  unitCost: lot.unitCost,
  amount: lot.originalQty * lot.unitCost,
  purchaseDate: lot.purchaseDate,
  status: lot.isPaid ? 'paid' : 'outstanding',
  paidDate: lot.paidDate,
})

export default function SupplierPayments() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [expandedLotId, setExpandedLotId] = useState(null)

  const range = useMemo(() => monthRangeISO(year, month), [year, month])
  const { data: lots = [], isLoading, isError, isFetching, refetch } = useAllLots(range)
  const updateLotPayment = useUpdateLotPayment()

  const rows = useMemo(() => lots.map((lot) => toRow(lot)), [lots])

  const expandedRow = rows.find((r) => r.lotId === expandedLotId)
  const { data: materialLots = [] } = useRawMaterialLots(
    expandedRow?.rawMaterialId,
    { to: todayISO() },
    { enabled: !!expandedRow },
  )
  const history = expandedRow
    ? materialLots
      .filter((lot) => lot.id !== expandedRow.lotId)
      .map((lot) => toRow(lot, { materialName: expandedRow.materialName, unit: expandedRow.unit }))
      .sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate))
    : []

  const outstandingTotal = rows.filter((r) => r.status === 'outstanding').reduce((s, r) => s + r.amount, 0)
  const paidTotal = rows.filter((r) => r.status === 'paid').reduce((s, r) => s + r.amount, 0)

  const toggleExpand = (lotId) => {
    setExpandedLotId((prev) => (prev === lotId ? null : lotId))
  }

  const markPaid = (lotId) => {
    updateLotPayment.mutate({ lotId, isPaid: true })
  }

  return (
    <div>
      <PageHeader eyebrow="Finance / Supplier Payments" title="Supplier Payments" description="Track payments to raw material suppliers by lot. Click a row to see previous bills." />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-4">
        <StatCard label="Outstanding" value={`₹${outstandingTotal.toLocaleString('en-IN')}`} icon={Truck} chipColor="bg-cherry-compote/15 text-cherry-compote" danger={outstandingTotal > 0} />
        <StatCard label="Paid" value={`₹${paidTotal.toLocaleString('en-IN')}`} icon={Check} chipColor="bg-matcha-glaze/15 text-matcha-glaze" />
      </div>

      <MonthFilterBar year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m) }} />

      {isError ? (
        <ErrorState description="Could not load supplier purchases." onRetry={refetch} retrying={isFetching} />
      ) : isLoading ? (
        <p className="px-1 py-8 text-center text-sm text-espresso/40">Loading purchases…</p>
      ) : rows.length === 0 ? (
        <EmptyState icon={Truck} title="No purchases this month" description="Raw material lots purchased in this month will appear here." />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-bakery border border-espresso/8 bg-proof-cream shadow-bakery lg:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-espresso/10 bg-crust/30 text-left">
                  <th className="px-4 py-3 w-10"></th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Vendor</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Material</th>
                  <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-espresso/50">Qty × Rate</th>
                  <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-espresso/50">Amount</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Date</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Status</th>
                  <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-espresso/50">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const isExpanded = expandedLotId === r.lotId
                  return (
                    <FragmentRow
                      key={r.lotId}
                      row={r}
                      isExpanded={isExpanded}
                      history={isExpanded ? history : []}
                      onToggle={() => toggleExpand(r.lotId)}
                      onMarkPaid={() => markPaid(r.lotId)}
                    />
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="flex flex-col gap-3 lg:hidden">
            {rows.map((r) => {
              const isExpanded = expandedLotId === r.lotId
              return (
                <div key={r.lotId} className="rounded-bakery border border-espresso/8 bg-proof-cream p-4 shadow-bakery">
                  <button onClick={() => toggleExpand(r.lotId)} className="flex w-full items-start justify-between">
                    <div>
                      <p className="font-medium text-espresso">{r.vendor}</p>
                      <p className="text-sm text-espresso/60">{r.materialName}</p>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-espresso/40 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-mono text-sm text-espresso/50">{r.quantity} {r.unit} × ₹{r.unitCost}</span>
                    <span className="font-mono font-semibold text-espresso">₹{r.amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-mono text-xs text-espresso/40">{new Date(r.purchaseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                    <div className="flex items-center gap-2">
                      <PaidBadge status={r.status} />
                      {r.status === 'outstanding' && (
                        <button
                          onClick={() => markPaid(r.lotId)}
                          className="inline-flex items-center gap-1 rounded-lg bg-matcha-glaze/15 px-2.5 py-1.5 text-xs font-medium text-matcha-glaze hover:bg-matcha-glaze/25"
                        >
                          <Check className="h-3.5 w-3.5" /> Mark Paid
                        </button>
                      )}
                    </div>
                  </div>
                  {isExpanded && (
                    <ExpandedHistory history={history} materialName={r.materialName} mobile />
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

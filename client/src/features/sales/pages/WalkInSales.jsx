import { useState } from 'react'
import { Plus, ShoppingBag, Wallet, Check, AlertCircle, CreditCard } from 'lucide-react'
import { useWalkInSales, useCreateWalkInSale, useSettleWalkInSale, useRecordWalkInSalePayment } from '@/features/sales/hooks'
import { useReadyStock } from '@/features/inventory/hooks/useReadyStock'
import { usePagination } from '@/hooks'
import { Button, EmptyState, ErrorState, ExportMenu, Field, Modal, PageHeader, Pagination, StatCard, inputClass } from '@/components/shared'
import { todayISO, formatDate, exportPDF, exportExcel } from '@/utils'

const PAGE_SIZE = 10

const emptyForm = () => ({ productId: '', quantity: '', amount: '', paymentStatus: 'paid', amountPaid: '', saleDate: todayISO() })

function AddWalkInSaleModal({ open, onClose, products }) {
  const createSale = useCreateWalkInSale()
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const isPartial = form.paymentStatus === 'partial'

  const reset = () => {
    setForm(emptyForm())
    setError('')
  }

  const close = () => {
    reset()
    onClose()
  }

  const submit = async () => {
    if (!form.productId || !form.quantity || !form.amount) return
    if (isPartial && !form.amountPaid) return

    setError('')
    try {
      await createSale.mutateAsync(form)
      close()
    } catch (err) {
      setError(err.message || 'Could not record sale.')
    }
  }

  const busy = createSale.isPending

  return (
    <Modal open={open} onClose={close} eyebrow="Sales" title="Record Walk-in Sale"
      footer={<><Button variant="secondary" onClick={close} disabled={busy}>Cancel</Button><Button onClick={submit} disabled={busy}>{busy ? 'Saving…' : 'Save'}</Button></>}>
      <div className="flex flex-col gap-4">
        <Field label="Product" required>
          <select className={inputClass} value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} autoFocus>
            <option value="">Select product...</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name} · {p.availableQty} {p.unit} available</option>
            ))}
          </select>
        </Field>
        <Field label="Quantity" required>
          <input type="number" className={inputClass} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="0" />
        </Field>
        <Field label="Amount (₹)" required>
          <input type="number" className={inputClass} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Counter rate" />
        </Field>
        <Field label="Payment" required>
          <select className={inputClass} value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value, amountPaid: e.target.value === 'paid' ? '' : form.amountPaid })}>
            <option value="paid">Paid in full</option>
            <option value="partial">Partial</option>
          </select>
        </Field>
        {isPartial && (
          <Field label="Amount paid now (₹)" required>
            <input type="number" className={inputClass} value={form.amountPaid} onChange={(e) => setForm({ ...form, amountPaid: e.target.value })} placeholder="0" max={form.amount || undefined} />
          </Field>
        )}
        <Field label="Date" required>
          <input type="date" className={inputClass} value={form.saleDate} onChange={(e) => setForm({ ...form, saleDate: e.target.value })} />
        </Field>
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-cherry-compote/10 px-3 py-2 text-sm text-cherry-compote">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </Modal>
  )
}

function RecordPaymentModal({ sale, onClose }) {
  const recordPayment = useRecordWalkInSalePayment()
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')

  const balance = sale ? Number(sale.amount) - Number(sale.amountPaid || 0) : 0

  const close = () => {
    setAmount('')
    setError('')
    onClose()
  }

  const submit = async () => {
    const value = Number(amount)
    if (!value || value <= 0) {
      setError('Enter an amount greater than 0.')
      return
    }
    if (value > balance) {
      setError(`Cannot pay more than the remaining balance of ₹${balance.toLocaleString('en-IN')}.`)
      return
    }

    setError('')
    try {
      await recordPayment.mutateAsync({ id: sale.id, amount: value })
      close()
    } catch (err) {
      setError(err.message || 'Could not record payment.')
    }
  }

  const busy = recordPayment.isPending

  return (
    <Modal open={!!sale} onClose={close} eyebrow="Sales" title={`Record Payment — ${sale?.productName || ''}`}
      footer={<><Button variant="secondary" onClick={close} disabled={busy}>Cancel</Button><Button onClick={submit} disabled={busy}>{busy ? 'Saving…' : 'Record payment'}</Button></>}>
      <div className="flex flex-col gap-4">
        <Field label="Amount (₹)" required>
          <input type="number" className={inputClass} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" autoFocus />
        </Field>
        <p className="text-xs text-espresso/40">Remaining balance: ₹{balance.toLocaleString('en-IN')}</p>
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-cherry-compote/10 px-3 py-2 text-sm text-cherry-compote">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </Modal>
  )
}

const saleRow = (s) => {
  const isPaid = s.paymentStatus === 'paid'
  const balance = Number(s.amount) - Number(s.amountPaid || 0)
  return [
    s.productName,
    formatDate(s.saleDate),
    `${s.quantity} ${s.unit}`,
    `₹${Number(s.amount).toLocaleString('en-IN')}`,
    isPaid ? 'Paid' : 'Partial',
    isPaid ? '—' : `₹${Number(s.amountPaid || 0).toLocaleString('en-IN')}`,
    isPaid ? '—' : `₹${balance.toLocaleString('en-IN')}`,
  ]
}
const EXPORT_COLUMNS = ['Product', 'Date', 'Quantity', 'Amount', 'Status', 'Paid', 'Balance']

export default function WalkInSales() {
  const { data: sales = [], isLoading, isError, error, refetch } = useWalkInSales()
  const { data: products = [] } = useReadyStock({ filter: 'all' })
  const settleSale = useSettleWalkInSale()
  const [modalOpen, setModalOpen] = useState(false)
  const [paymentSale, setPaymentSale] = useState(null)
  const { page, setPage, totalPages, start, end } = usePagination(sales.length, PAGE_SIZE)
  const pagedSales = sales.slice(start, end)

  const outstanding = sales.filter((s) => s.paymentStatus === 'partial').reduce((sum, s) => sum + Number(s.amount), 0)
  const paid = sales.filter((s) => s.paymentStatus === 'paid').reduce((sum, s) => sum + Number(s.amount), 0)

  const handleExportPDF = () => {
    exportPDF({ title: 'Walk-in Sales', subtitle: 'Break Times Bakery', columns: EXPORT_COLUMNS, rows: sales.map(saleRow), filename: 'walk-in-sales.pdf' })
  }
  const handleExportExcel = () => {
    exportExcel({ title: 'Walk-in Sales', subtitle: 'Break Times Bakery', columns: EXPORT_COLUMNS, rows: sales.map(saleRow), sheetName: 'Walk-in Sales', filename: 'walk-in-sales.xlsx' })
  }

  return (
    <div>
      <PageHeader eyebrow="Sales" title="Walk-in Sales" description="Instant counter sales to walk-in customers, drawn from Ready Stock."
        actions={<>
          <ExportMenu onExportPDF={handleExportPDF} onExportExcel={handleExportExcel} />
          <Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> Record sale</Button>
        </>} />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-4">
        <StatCard label="Outstanding" value={`₹${outstanding.toLocaleString('en-IN')}`} icon={Wallet} chipColor="bg-cherry-compote/15 text-cherry-compote" danger={outstanding > 0} />
        <StatCard label="Paid" value={`₹${paid.toLocaleString('en-IN')}`} icon={Check} chipColor="bg-matcha-glaze/15 text-matcha-glaze" />
      </div>

      {isError ? (
        <ErrorState description={error?.message} onRetry={refetch} />
      ) : isLoading ? (
        <p role="status" className="text-sm text-espresso/50">Loading walk-in sales…</p>
      ) : sales.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="No walk-in sales yet" description="Record a counter sale to get started." />
      ) : (
        <div className="overflow-hidden rounded-bakery border border-espresso/8 bg-proof-cream shadow-bakery">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-espresso/10 bg-crust/30 text-left">
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Product</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Date</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Quantity</th>
                  <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-espresso/50">Amount</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Status</th>
                  <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-espresso/50">Balance</th>
                  <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-espresso/50">Action</th>
                </tr>
              </thead>
              <tbody>
                {pagedSales.map((s) => {
                  const isPaid = s.paymentStatus === 'paid'
                  const balance = Number(s.amount) - Number(s.amountPaid || 0)
                  return (
                    <tr key={s.id} className="border-b border-espresso/8 last:border-0 hover:bg-crust/20">
                      <td className="px-4 py-3 font-medium text-espresso">{s.productName}</td>
                      <td className="px-4 py-3 font-mono text-xs text-espresso/60">{formatDate(s.saleDate)}</td>
                      <td className="px-4 py-3 text-espresso/70">{s.quantity} {s.unit}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-espresso">₹{Number(s.amount).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                          isPaid ? 'bg-matcha-glaze/15 text-matcha-glaze' : 'bg-cherry-compote/15 text-cherry-compote'
                        }`}>
                          <span className={`h-2 w-2 rounded-full ${isPaid ? 'bg-matcha-glaze' : 'bg-cherry-compote'}`} />
                          {isPaid ? 'Paid' : 'Partial'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-cherry-compote">{isPaid ? '—' : `₹${balance.toLocaleString('en-IN')}`}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {!isPaid && (
                            <>
                              <button onClick={() => setPaymentSale(s)} className="inline-flex items-center gap-1 rounded-lg bg-oven-amber/15 px-2.5 py-1.5 text-xs font-medium text-oven-amber hover:bg-oven-amber/25">
                                <CreditCard className="h-3.5 w-3.5" /> Record Payment
                              </button>
                              <button onClick={() => settleSale.mutate(s.id)} className="inline-flex items-center gap-1 rounded-lg bg-matcha-glaze/15 px-2.5 py-1.5 text-xs font-medium text-matcha-glaze hover:bg-matcha-glaze/25">
                                <Check className="h-3.5 w-3.5" /> Mark Fully Paid
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={sales.length} pageSize={PAGE_SIZE} />
        </div>
      )}

      <AddWalkInSaleModal open={modalOpen} onClose={() => setModalOpen(false)} products={products} />
      <RecordPaymentModal sale={paymentSale} onClose={() => setPaymentSale(null)} />
    </div>
  )
}

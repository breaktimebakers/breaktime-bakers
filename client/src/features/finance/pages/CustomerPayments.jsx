import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Plus, Check, HandCoins, Wallet, MapPin, ShoppingBag, ArrowRight } from 'lucide-react'
import { useFinance } from '@/features/finance/hooks'
import { useSales, useWalkInSales } from '@/features/sales/hooks'
import { Button, Field, Modal, PageHeader, StatCard, inputClass } from '@/components/shared'
import { PaidBadge } from '../components/PaidBadge'
import { todayISO } from '@/utils'

export function PaymentEntryRow({ c, onRecordPayment, onMarkPaid }) {
  const balance = c.amount - (c.amountPaid || 0)
  const hasPartial = (c.amountPaid || 0) > 0 && c.status === 'outstanding'
  return (
    <div className="rounded-bakery border border-espresso/8 bg-proof-cream p-4 shadow-bakery transition hover:shadow-bakery-lg">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-espresso">{c.buyerName}</p>
          <p className="mt-0.5 font-mono text-xs text-espresso/40">
            {new Date(c.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            {c.status === 'paid' && c.paidDate && ` · Paid ${new Date(c.paidDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono font-semibold text-espresso">₹{c.amount.toLocaleString('en-IN')}</p>
          {hasPartial && <p className="font-mono text-xs text-matcha-glaze">Paid ₹{(c.amountPaid || 0).toLocaleString('en-IN')}</p>}
        </div>
        <PaidBadge status={c.status} />
      </div>
      {hasPartial && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-espresso/50">Remaining: <span className="font-mono font-medium text-cherry-compote">₹{balance.toLocaleString('en-IN')}</span></span>
            <span className="font-mono text-espresso/40">{Math.round(((c.amountPaid || 0) / c.amount) * 100)}% paid</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-crust/40">
            <div className="h-full rounded-full bg-matcha-glaze/60" style={{ width: `${((c.amountPaid || 0) / c.amount) * 100}%` }} />
          </div>
        </div>
      )}
      {c.status === 'outstanding' && (
        <div className="mt-3 flex items-center gap-2">
          {onRecordPayment && (
            <button onClick={() => onRecordPayment(c)} className="inline-flex items-center gap-1 rounded-lg bg-oven-amber/15 px-2.5 py-1.5 text-xs font-medium text-oven-amber hover:bg-oven-amber/25">
              <Wallet className="h-3.5 w-3.5" /> Record Payment
            </button>
          )}
          {balance > 0 && onMarkPaid && (
            <button onClick={() => onMarkPaid(c.id)} className="inline-flex items-center gap-1 rounded-lg bg-matcha-glaze/15 px-2.5 py-1.5 text-xs font-medium text-matcha-glaze hover:bg-matcha-glaze/25">
              <Check className="h-3.5 w-3.5" /> Mark Fully Paid
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function PartialPaymentModal({ payment, onClose, onRecord }) {
  const [partialAmount, setPartialAmount] = useState('')
  if (!payment) return null
  const balance = payment.amount - (payment.amountPaid || 0)
  const handleRecord = () => {
    if (!partialAmount) return
    onRecord(payment.id, partialAmount)
    setPartialAmount('')
    onClose()
  }
  return (
    <Modal
      open={!!payment}
      onClose={onClose}
      eyebrow="Finance"
      title="Record Payment"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={handleRecord}>Record</Button></>}
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-lg bg-crust/30 p-3">
          <p className="text-sm font-medium text-espresso">{payment.buyerName}</p>
          <div className="mt-1.5 flex items-center justify-between text-xs">
            <span className="text-espresso/50">Total bill: <span className="font-mono font-medium text-espresso">₹{payment.amount.toLocaleString('en-IN')}</span></span>
            <span className="text-espresso/50">Already paid: <span className="font-mono font-medium text-matcha-glaze">₹{(payment.amountPaid || 0).toLocaleString('en-IN')}</span></span>
          </div>
          <p className="mt-1.5 text-xs text-espresso/50">Remaining balance: <span className="font-mono font-bold text-cherry-compote">₹{balance.toLocaleString('en-IN')}</span></p>
        </div>
        <Field label="Payment amount (₹)" required>
          <input type="number" className={inputClass} value={partialAmount} onChange={(e) => setPartialAmount(e.target.value)} placeholder={`Up to ₹${balance.toLocaleString('en-IN')}`} autoFocus max={balance} />
        </Field>
        {partialAmount && Number(partialAmount) >= balance && <p className="text-xs text-matcha-glaze">This will mark the payment as fully paid.</p>}
      </div>
    </Modal>
  )
}

export function AddPaymentModal({ open, onClose, onSubmit, stores, areas, prefillStoreId }) {
  const [form, setForm] = useState(() => ({
    storeId: prefillStoreId || '',
    amount: '',
    date: todayISO(),
  }))

  const handleSubmit = () => {
    if (!form.storeId || !form.amount) return
    const store = stores.find((s) => s.id === form.storeId)
    onSubmit({ buyerName: store?.dealerName, buyerType: 'store', storeId: form.storeId, areaId: store?.areaId || null, amount: form.amount, date: form.date })
    setForm({ storeId: prefillStoreId || '', amount: '', date: todayISO() })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} eyebrow="Finance" title="Add Customer Payment"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={handleSubmit}>Save</Button></>}>
      <div className="flex flex-col gap-4">
        <Field label="Store" required>
          <select className={inputClass} value={form.storeId} onChange={(e) => setForm({ ...form, storeId: e.target.value })} autoFocus>
            <option value="">Select store...</option>
            {areas.map((a) => (
              <optgroup key={a.id} label={a.name}>
                {stores.filter((s) => s.areaId === a.id).map((s) => <option key={s.id} value={s.id}>{s.dealerName}</option>)}
              </optgroup>
            ))}
          </select>
        </Field>
        <Field label="Total amount (₹)" required>
          <input type="number" className={inputClass} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" />
        </Field>
        <Field label="Date" required>
          <input type="date" className={inputClass} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </Field>
      </div>
    </Modal>
  )
}

export default function CustomerPayments() {
  const { customerPayments, addCustomerPayment, outstandingCustomer, getAreaPaymentSummary } = useFinance()
  const { areas, stores } = useSales()
  const { data: walkInSales = [] } = useWalkInSales()
  const [modalOpen, setModalOpen] = useState(false)

  const totalPaid = customerPayments.filter((c) => c.status === 'paid').reduce((s, c) => s + c.amount, 0)
  const walkInOutstanding = walkInSales.filter((s) => s.paymentStatus === 'partial').reduce((sum, s) => sum + Number(s.amount), 0)
  const walkInPaid = walkInSales.filter((s) => s.paymentStatus === 'paid').reduce((sum, s) => sum + Number(s.amount), 0)

  return (
    <div>
      <PageHeader eyebrow="Finance / Customer Payments" title="Customer Payments" description="Track payments from stores and retail buyers across areas."
        actions={<Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> Add payment</Button>} />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-4">
        <StatCard label="Outstanding" value={`₹${outstandingCustomer.toLocaleString('en-IN')}`} icon={HandCoins} chipColor="bg-cherry-compote/15 text-cherry-compote" danger={outstandingCustomer > 0} />
        <StatCard label="Paid" value={`₹${totalPaid.toLocaleString('en-IN')}`} icon={Check} chipColor="bg-matcha-glaze/15 text-matcha-glaze" />
      </div>

      {/* Area cards */}
      <h2 className="mb-3 font-display text-lg font-semibold text-espresso">Areas</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {areas.map((a) => {
          const summary = getAreaPaymentSummary(a.id)
          const storeCount = stores.filter((s) => s.areaId === a.id).length
          return (
            <Link key={a.id} to="/finance/customer-payments/$areaId" params={{ areaId: a.id }}
              className="group rounded-bakery border border-espresso/8 bg-proof-cream p-5 shadow-bakery transition-all hover:-translate-y-0.5 hover:shadow-bakery-lg">
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-bakery bg-oven-amber/15 text-oven-amber">
                  <MapPin className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-espresso/30 transition-transform group-hover:translate-x-1" />
              </div>
              <h3 className="mt-3 font-display text-lg font-semibold text-espresso">{a.name}</h3>
              <p className="text-xs text-espresso/50">{storeCount} {storeCount === 1 ? 'store' : 'stores'}</p>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-espresso/50">Outstanding: <span className="font-mono font-medium text-cherry-compote">₹{summary.outstanding.toLocaleString('en-IN')}</span></span>
                <span className="text-espresso/50">Paid: <span className="font-mono font-medium text-matcha-glaze">₹{summary.paid.toLocaleString('en-IN')}</span></span>
              </div>
            </Link>
          )
        })}

        {/* Local / Walk-in card - links straight to the counter (Sales'
            Walk-in Sales page), where these sales are actually recorded
            and settled, rather than to a read-only Finance mirror. */}
        <Link to="/sales/walk-in"
          className="group rounded-bakery border border-dashed border-espresso/15 bg-crust/20 p-5 shadow-bakery transition-all hover:-translate-y-0.5 hover:shadow-bakery-lg">
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-bakery bg-espresso/8 text-espresso/50">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4 text-espresso/30 transition-transform group-hover:translate-x-1" />
          </div>
          <h3 className="mt-3 font-display text-lg font-semibold text-espresso/70">Local / Walk-in</h3>
          <p className="text-xs text-espresso/40">Counter sales, recorded in Sales</p>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-espresso/50">Outstanding: <span className="font-mono font-medium text-cherry-compote">₹{walkInOutstanding.toLocaleString('en-IN')}</span></span>
            <span className="text-espresso/50">Paid: <span className="font-mono font-medium text-matcha-glaze">₹{walkInPaid.toLocaleString('en-IN')}</span></span>
          </div>
        </Link>
      </div>

      <AddPaymentModal open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={addCustomerPayment} stores={stores} areas={areas} />
    </div>
  )
}

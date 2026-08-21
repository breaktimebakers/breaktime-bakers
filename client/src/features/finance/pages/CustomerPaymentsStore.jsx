import { useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { Plus, Store, Wallet, Check } from 'lucide-react'
import { useFinance } from '@/features/finance/hooks'
import { useSales } from '@/features/sales/hooks'
import { Button, EmptyState, PageHeader, StatCard } from '@/components/shared'
import { PaidBadge } from '../components/PaidBadge'
import { AddPaymentModal, PartialPaymentModal } from './CustomerPayments'

export default function CustomerPaymentsStore() {
  const { areaId, storeId } = useParams({ strict: false })
  const { getStorePaymentSummary, addCustomerPayment, addPartialPayment, markCustomerPaymentPaid } = useFinance()
  const { areas, stores } = useSales()
  const [modalOpen, setModalOpen] = useState(false)
  const [partialModal, setPartialModal] = useState(null)

  const area = areas.find((a) => a.id === areaId)
  const store = stores.find((s) => s.id === storeId)
  if (!area || !store) return <EmptyState icon={Store} title="Store not found" description="This store does not exist." />

  const summary = getStorePaymentSummary(storeId)
  const entries = [...summary.entries].sort((a, b) => b.date.localeCompare(a.date))

  // Build a chronological timeline from entries and their paymentHistory
  const timeline = []
  entries.forEach((e) => {
    timeline.push({ type: 'bill', date: e.date, entry: e, label: `Bill of ₹${e.amount.toLocaleString('en-IN')}` })
    ;(e.paymentHistory || []).forEach((ph) => {
      timeline.push({ type: 'payment', date: ph.date, entry: e, amount: ph.amount, label: `Payment of ₹${ph.amount.toLocaleString('en-IN')}` })
    })
  })
  timeline.sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div>
      <div className="mb-4 flex items-center gap-1.5 text-sm text-espresso/50">
        <Link to="/finance/customer-payments" className="hover:text-oven-amber">Customer Payments</Link>
        <span>/</span>
        <Link to="/finance/customer-payments/$areaId" params={{ areaId }} className="hover:text-oven-amber">{area.name}</Link>
        <span>/</span>
        <span className="text-espresso">{store.dealerName}</span>
      </div>

      <PageHeader eyebrow="Finance / Customer Payments" title={store.dealerName} description={store.shopName || store.storeType}
        actions={<Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> Add payment</Button>} />

      {/* Summary card */}
      <div className="mb-4 grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard label="Total Billed" value={`₹${summary.totalBilled.toLocaleString('en-IN')}`} icon={Store} chipColor="bg-espresso/8 text-espresso/60" />
        <StatCard label="Paid" value={`₹${summary.paid.toLocaleString('en-IN')}`} icon={Check} chipColor="bg-matcha-glaze/15 text-matcha-glaze" />
        <StatCard label="Outstanding" value={`₹${summary.outstanding.toLocaleString('en-IN')}`} icon={Wallet} chipColor="bg-cherry-compote/15 text-cherry-compote" danger={summary.outstanding > 0} />
      </div>

      {/* Payment history timeline */}
      <h2 className="mb-3 font-display text-lg font-semibold text-espresso">Payment History</h2>
      {timeline.length === 0 ? (
        <EmptyState icon={Wallet} title="No payments yet" description="Add a payment for this store to get started." />
      ) : (
        <div className="flex flex-col gap-2">
          {timeline.map((item, i) => {
            const balance = item.entry.amount - (item.entry.amountPaid || 0)
            const isBill = item.type === 'bill'
            return (
              <div key={i} className={`rounded-bakery border bg-proof-cream p-4 shadow-bakery ${isBill ? 'border-espresso/8' : 'border-matcha-glaze/20'}`}>
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-bakery ${isBill ? 'bg-espresso/8 text-espresso/50' : 'bg-matcha-glaze/15 text-matcha-glaze'}`}>
                    {isBill ? <Store className="h-4 w-4" /> : <Wallet className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium ${isBill ? 'text-espresso' : 'text-matcha-glaze'}`}>{item.label}</p>
                    <p className="font-mono text-xs text-espresso/40">{new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  </div>
                  {isBill && <PaidBadge status={item.entry.status} />}
                </div>
                {/* Show action buttons on bill rows that are outstanding */}
                {isBill && item.entry.status === 'outstanding' && (
                  <div className="mt-3 flex items-center gap-2 pl-11">
                    <button onClick={() => setPartialModal(item.entry)} className="inline-flex items-center gap-1 rounded-lg bg-oven-amber/15 px-2.5 py-1.5 text-xs font-medium text-oven-amber hover:bg-oven-amber/25">
                      <Wallet className="h-3.5 w-3.5" /> Record Payment
                    </button>
                    {balance > 0 && (
                      <button onClick={() => markCustomerPaymentPaid(item.entry.id)} className="inline-flex items-center gap-1 rounded-lg bg-matcha-glaze/15 px-2.5 py-1.5 text-xs font-medium text-matcha-glaze hover:bg-matcha-glaze/25">
                        <Check className="h-3.5 w-3.5" /> Mark Fully Paid
                      </button>
                    )}
                  </div>
                )}
                {/* Show remaining balance on bill rows with partial payments */}
                {isBill && (item.entry.amountPaid || 0) > 0 && item.entry.status === 'outstanding' && (
                  <div className="mt-2 pl-11">
                    <p className="text-xs text-espresso/50">Remaining: <span className="font-mono font-medium text-cherry-compote">₹{balance.toLocaleString('en-IN')}</span></p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <AddPaymentModal open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={addCustomerPayment} stores={stores} areas={areas} prefillStoreId={storeId} />
      <PartialPaymentModal payment={partialModal} onClose={() => setPartialModal(null)} onRecord={addPartialPayment} />
    </div>
  )
}

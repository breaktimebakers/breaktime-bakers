import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Plus, User, Wallet, Check } from 'lucide-react'
import { useFinance } from '@/features/finance/hooks'
import { useSales } from '@/features/sales/hooks'
import { Button, EmptyState, PageHeader, StatCard } from '@/components/shared'
import { AddPaymentModal, PartialPaymentModal, PaymentEntryRow } from './CustomerPayments'

export default function CustomerPaymentsLocal() {
  const { customerPayments, addCustomerPayment, addPartialPayment, markCustomerPaymentPaid, getLocalBuyerSummary } = useFinance()
  const { stores, areas } = useSales()
  const [modalOpen, setModalOpen] = useState(false)
  const [partialModal, setPartialModal] = useState(null)

  const summary = getLocalBuyerSummary()
  const localPayments = customerPayments.filter((c) => c.buyerType === 'individual').sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div>
      <div className="mb-4 flex items-center gap-1.5 text-sm text-espresso/50">
        <Link to="/finance/customer-payments" className="hover:text-oven-amber">Customer Payments</Link>
        <span>/</span>
        <span className="text-espresso">Local / Walk-in</span>
      </div>

      <PageHeader eyebrow="Finance / Customer Payments" title="Local / Walk-in" description="Individual buyers not associated with a store."
        actions={<Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> Add payment</Button>} />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-4">
        <StatCard label="Outstanding" value={`₹${summary.outstanding.toLocaleString('en-IN')}`} icon={Wallet} chipColor="bg-cherry-compote/15 text-cherry-compote" danger={summary.outstanding > 0} />
        <StatCard label="Paid" value={`₹${summary.paid.toLocaleString('en-IN')}`} icon={Check} chipColor="bg-matcha-glaze/15 text-matcha-glaze" />
      </div>

      {localPayments.length === 0 ? (
        <EmptyState icon={User} title="No individual payments" description="Add a payment for a walk-in buyer to get started." />
      ) : (
        <div className="flex flex-col gap-2">
          {localPayments.map((c) => (
            <PaymentEntryRow key={c.id} c={c}
              onRecordPayment={(p) => setPartialModal(p)}
              onMarkPaid={(id) => markCustomerPaymentPaid(id)} />
          ))}
        </div>
      )}

      <AddPaymentModal open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={addCustomerPayment} stores={stores} areas={areas} />
      <PartialPaymentModal payment={partialModal} onClose={() => setPartialModal(null)} onRecord={addPartialPayment} />
    </div>
  )
}

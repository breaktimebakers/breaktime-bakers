import { useState } from 'react'
import { Plus, ShoppingBag, Wallet, Check } from 'lucide-react'
import { useWalkInSales, useCreateWalkInSale, useSettleWalkInSale } from '@/features/sales/hooks'
import { useReadyStock } from '@/features/inventory/hooks/useReadyStock'
import { Button, EmptyState, ErrorState, Field, Modal, PageHeader, StatCard, inputClass } from '@/components/shared'
import { WalkInSaleRow } from '../components/WalkInSaleRow'
import { todayISO } from '@/utils'

function AddWalkInSaleModal({ open, onClose, onSubmit, products }) {
  const [form, setForm] = useState(() => ({ productId: '', quantity: '', amount: '', paymentStatus: 'paid', amountPaid: '', saleDate: todayISO() }))
  const isPartial = form.paymentStatus === 'partial'

  const handleSubmit = () => {
    if (!form.productId || !form.quantity || !form.amount) return
    if (isPartial && !form.amountPaid) return
    onSubmit(form)
    setForm({ productId: '', quantity: '', amount: '', paymentStatus: 'paid', amountPaid: '', saleDate: todayISO() })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} eyebrow="Sales" title="Record Walk-in Sale"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={handleSubmit}>Save</Button></>}>
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
      </div>
    </Modal>
  )
}

export default function WalkInSales() {
  const { data: sales = [], isLoading, isError, error, refetch } = useWalkInSales()
  const { data: products = [] } = useReadyStock()
  const createSale = useCreateWalkInSale()
  const settleSale = useSettleWalkInSale()
  const [modalOpen, setModalOpen] = useState(false)

  const outstanding = sales.filter((s) => s.paymentStatus === 'partial').reduce((sum, s) => sum + Number(s.amount), 0)
  const paid = sales.filter((s) => s.paymentStatus === 'paid').reduce((sum, s) => sum + Number(s.amount), 0)

  return (
    <div>
      <PageHeader eyebrow="Sales" title="Walk-in Sales" description="Instant counter sales to walk-in customers, drawn from Ready Stock."
        actions={<Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> Record sale</Button>} />

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
        <div className="flex flex-col gap-2">
          {sales.map((s) => (
            <WalkInSaleRow key={s.id} sale={s} onSettle={(id) => settleSale.mutate(id)} />
          ))}
        </div>
      )}

      <AddWalkInSaleModal open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={(body) => createSale.mutate(body)} products={products} />
    </div>
  )
}

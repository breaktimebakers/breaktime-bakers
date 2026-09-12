import { Fragment, useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { AlertCircle, ChevronDown, Check, CreditCard, Store, Wallet } from 'lucide-react'
import { useStorePaymentLedger, useOrderPayments, useRecordOrderPayment } from '@/features/finance/hooks'
import { useAreas, useAllStores } from '@/features/sales/hooks'
import { useWorkers } from '@/features/workers/hooks'
import { Button, EmptyState, ErrorState, Field, Modal, PageHeader, StatCard, inputClass } from '@/components/shared'
import { formatDate, todayISO } from '@/utils'
import { PaidBadge } from '../components/PaidBadge'

const STATUS_PILLS = [
  ['all', 'All'],
  ['paid', 'Paid'],
  ['partial', 'Partial'],
  ['unpaid', 'Unpaid'],
]

function RecordPaymentModal({ order, drivers, onClose }) {
  const recordPayment = useRecordOrderPayment()
  const [amount, setAmount] = useState('')
  const [collectedBy, setCollectedBy] = useState('')
  const [paymentDate, setPaymentDate] = useState(todayISO())
  const [error, setError] = useState('')

  const close = () => {
    setAmount('')
    setCollectedBy('')
    setPaymentDate(todayISO())
    setError('')
    onClose()
  }

  if (!order) return null

  const submit = async () => {
    const value = Number(amount)
    if (!value || value <= 0) {
      setError('Enter an amount greater than 0.')
      return
    }
    if (value > order.balance) {
      setError(`Cannot exceed the remaining balance of ₹${order.balance.toLocaleString('en-IN')}.`)
      return
    }

    setError('')
    try {
      await recordPayment.mutateAsync({ orderId: order.id, amount: value, collectedBy: collectedBy || undefined, paymentDate })
      close()
    } catch (err) {
      setError(err.message || 'Could not record payment.')
    }
  }

  const busy = recordPayment.isPending

  return (
    <Modal open={!!order} onClose={close} eyebrow="Finance" title="Record Payment"
      footer={<><Button variant="secondary" onClick={close} disabled={busy}>Cancel</Button><Button onClick={submit} disabled={busy}>{busy ? 'Saving…' : 'Record payment'}</Button></>}>
      <div className="flex flex-col gap-4">
        <div className="rounded-lg bg-crust/30 p-3 text-xs text-espresso/60">
          <p>Order billed ₹{order.billed.toLocaleString('en-IN')} · Paid so far ₹{order.paid.toLocaleString('en-IN')}</p>
          <p className="mt-1 font-medium text-cherry-compote">Remaining balance: ₹{order.balance.toLocaleString('en-IN')}</p>
        </div>
        <Field label="Amount (₹)" required>
          <input type="number" className={inputClass} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" autoFocus max={order.balance} />
        </Field>
        <Field label="Collected by">
          <select className={inputClass} value={collectedBy} onChange={(e) => setCollectedBy(e.target.value)}>
            <option value="">Select driver...</option>
            {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </Field>
        <Field label="Date" required>
          <input type="date" className={inputClass} value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
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

// Lazy by design - only fetched once an order row is actually expanded,
// same reasoning as RawMaterials.jsx's LotHistory.
function PaymentHistory({ orderId }) {
  const { data: payments = [], isLoading, isError, isFetching, refetch } = useOrderPayments(orderId)

  if (isError) return <ErrorState description="Could not load payment history." onRetry={refetch} retrying={isFetching} />
  if (isLoading) return <p className="px-1 py-2 text-xs text-espresso/40">Loading payment history…</p>
  if (payments.length === 0) return <p className="px-1 py-2 text-xs text-espresso/40">No payments recorded against this order yet.</p>

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-espresso/40">
            <th className="py-1.5 pr-4">Date</th>
            <th className="py-1.5 pr-4">Amount</th>
            <th className="py-1.5 pr-4">Collected by</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p.id} className="border-t border-espresso/5">
              <td className="py-2 pr-4 text-espresso/70">{formatDate(p.paymentDate)}</td>
              <td className="py-2 pr-4 font-mono text-espresso/80">₹{Number(p.amount).toLocaleString('en-IN')}</td>
              <td className="py-2 pr-4 text-espresso/70">{p.collectedByName || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function CustomerPaymentsStore() {
  const { areaId, storeId } = useParams({ strict: false })
  const { data: areas = [] } = useAreas()
  const { data: stores = [] } = useAllStores()
  const { data: workers = [] } = useWorkers()
  const { data: ledger, isLoading, isError, error, refetch } = useStorePaymentLedger(storeId)
  const [status, setStatus] = useState('all')
  const [collector, setCollector] = useState('all')
  const [expanded, setExpanded] = useState(null)
  const [payingOrder, setPayingOrder] = useState(null)

  const area = areas.find((a) => a.id === areaId)
  const store = stores.find((s) => s.id === storeId)
  const drivers = workers.filter((w) => w.roles?.includes('delivery'))

  if (!area || !store) return <EmptyState icon={Store} title="Store not found" description="This store does not exist." />

  const orders = ledger?.orders || []
  const filteredOrders = orders.filter((o) => {
    if (status !== 'all' && o.paymentStatus !== status) return false
    if (collector !== 'all' && !(o.collectors || []).some((c) => c.id === collector)) return false
    return true
  })

  return (
    <div>
      <div className="mb-4 flex items-center gap-1.5 text-sm text-espresso/50">
        <Link to="/finance/customer-payments" className="hover:text-oven-amber">Customer Payments</Link>
        <span>/</span>
        <Link to="/finance/customer-payments/$areaId" params={{ areaId }} className="hover:text-oven-amber">{area.name}</Link>
        <span>/</span>
        <span className="text-espresso">{store.dealerName}</span>
      </div>

      <PageHeader eyebrow="Finance / Customer Payments" title={store.dealerName} description={store.shopName || store.storeType} />

      {/* Summary card */}
      <div className="mb-4 grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard label="Total Billed" value={`₹${(ledger?.totalBilled || 0).toLocaleString('en-IN')}`} icon={Store} chipColor="bg-espresso/8 text-espresso/60" />
        <StatCard label="Paid" value={`₹${(ledger?.paid || 0).toLocaleString('en-IN')}`} icon={Check} chipColor="bg-matcha-glaze/15 text-matcha-glaze" />
        <StatCard label="Outstanding" value={`₹${(ledger?.outstanding || 0).toLocaleString('en-IN')}`} icon={Wallet} chipColor="bg-cherry-compote/15 text-cherry-compote" danger={(ledger?.outstanding || 0) > 0} />
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="inline-flex flex-wrap rounded-full bg-crust p-0.5">
          {STATUS_PILLS.map(([value, label]) => (
            <button key={value} onClick={() => setStatus(value)} className={`rounded-full px-3 py-1 text-xs font-medium transition ${status === value ? 'bg-espresso text-crust' : 'text-espresso/60'}`}>{label}</button>
          ))}
        </div>
        <select className={`${inputClass} w-auto`} value={collector} onChange={(e) => setCollector(e.target.value)}>
          <option value="all">All collectors</option>
          {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {/* Orders - every order that's billed something, paid and unpaid
          alike, so this is a full audit trail, not just outstanding dues. */}
      <h2 className="mb-3 font-display text-lg font-semibold text-espresso">Orders</h2>
      {isError ? (
        <ErrorState description={error?.message} onRetry={refetch} />
      ) : isLoading ? (
        <p role="status" className="text-sm text-espresso/50">Loading orders…</p>
      ) : orders.length === 0 ? (
        <EmptyState icon={Wallet} title="No billed orders yet" description="Orders appear here once at least partially delivered." />
      ) : filteredOrders.length === 0 ? (
        <EmptyState icon={Wallet} title="No orders match your filters" description="Try a different status or collector." />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-bakery border border-espresso/8 bg-proof-cream shadow-bakery lg:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-espresso/10 bg-crust/30 text-left">
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Date</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Order Taker</th>
                  <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-espresso/50">Billed</th>
                  <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-espresso/50">Paid</th>
                  <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-espresso/50">Balance</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Status</th>
                  <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-espresso/50">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((o) => {
                  const isExpanded = expanded === o.id
                  return (
                    <Fragment key={o.id}>
                      <tr className="border-b border-espresso/8 last:border-0 hover:bg-crust/20">
                        <td className="px-4 py-3">
                          <button onClick={() => setExpanded(isExpanded ? null : o.id)} className="flex items-center gap-2 text-left font-medium text-espresso">
                            <ChevronDown className={`h-4 w-4 shrink-0 text-espresso/40 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            {formatDate(o.orderDate)}
                          </button>
                          {o.fulfillmentDate && <p className="ml-6 mt-0.5 text-xs text-espresso/40">Delivered {formatDate(o.fulfillmentDate)}</p>}
                        </td>
                        <td className="px-4 py-3 text-espresso/70">{o.orderTakerName}</td>
                        <td className="px-4 py-3 text-right font-mono text-espresso/70">₹{o.billed.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right font-mono text-matcha-glaze">₹{o.paid.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right font-mono text-cherry-compote">₹{o.balance.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3"><PaidBadge status={o.paymentStatus} /></td>
                        <td className="px-4 py-3 text-right">
                          {o.balance > 0 && (
                            <button onClick={() => setPayingOrder(o)} className="inline-flex items-center gap-1 rounded-lg bg-oven-amber/15 px-2.5 py-1.5 text-xs font-medium text-oven-amber hover:bg-oven-amber/25">
                              <CreditCard className="h-3.5 w-3.5" /> Record Payment
                            </button>
                          )}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-crust/20">
                          <td colSpan={7} className="px-4 py-4">
                            <PaymentHistory orderId={o.id} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="flex flex-col gap-3 lg:hidden">
            {filteredOrders.map((o) => {
              const isExpanded = expanded === o.id
              return (
                <div key={o.id} className="rounded-bakery border border-espresso/8 bg-proof-cream shadow-bakery">
                  <button onClick={() => setExpanded(isExpanded ? null : o.id)} className="flex w-full items-center gap-3 p-4 text-left">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-espresso">Order · {formatDate(o.orderDate)}</p>
                      <p className="text-xs text-espresso/50">
                        Order taker: {o.orderTakerName}{o.fulfillmentDate ? ` · Delivered ${formatDate(o.fulfillmentDate)}` : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-semibold text-espresso">₹{o.billed.toLocaleString('en-IN')}</p>
                      {o.paid > 0 && <p className="font-mono text-xs text-matcha-glaze">Paid ₹{o.paid.toLocaleString('en-IN')}</p>}
                    </div>
                    <PaidBadge status={o.paymentStatus} />
                    <ChevronDown className={`h-4 w-4 shrink-0 text-espresso/40 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                  {o.balance > 0 && (
                    <div className="flex items-center gap-2 px-4 pb-3">
                      <button onClick={() => setPayingOrder(o)} className="inline-flex items-center gap-1 rounded-lg bg-oven-amber/15 px-2.5 py-1.5 text-xs font-medium text-oven-amber hover:bg-oven-amber/25">
                        <CreditCard className="h-3.5 w-3.5" /> Record Payment
                      </button>
                      <span className="text-xs text-espresso/50">Remaining: <span className="font-mono font-medium text-cherry-compote">₹{o.balance.toLocaleString('en-IN')}</span></span>
                    </div>
                  )}
                  {isExpanded && (
                    <div className="border-t border-espresso/8 px-4 py-3">
                      <PaymentHistory orderId={o.id} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      <RecordPaymentModal order={payingOrder} drivers={drivers} onClose={() => setPayingOrder(null)} />
    </div>
  )
}

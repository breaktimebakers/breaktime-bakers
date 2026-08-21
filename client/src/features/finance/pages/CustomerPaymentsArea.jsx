import { useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { Plus, MapPin, ArrowRight, Store } from 'lucide-react'
import { useFinance } from '@/features/finance/hooks'
import { useSales } from '@/features/sales/hooks'
import { Button, EmptyState, PageHeader, StatCard } from '@/components/shared'
import { PaidBadge } from '../components/PaidBadge'
import { AddPaymentModal } from './CustomerPayments'

export default function CustomerPaymentsArea() {
  const { areaId } = useParams({ strict: false })
  const { getStorePaymentSummary, addCustomerPayment } = useFinance()
  const { areas, stores } = useSales()
  const [modalOpen, setModalOpen] = useState(false)

  const area = areas.find((a) => a.id === areaId)
  if (!area) return <EmptyState icon={MapPin} title="Area not found" description="This area does not exist." />

  const areaStores = stores.filter((s) => s.areaId === areaId)
  const storeRows = areaStores.map((s) => {
    const summary = getStorePaymentSummary(s.id)
    return { store: s, ...summary }
  })

  const totalOutstanding = storeRows.reduce((s, r) => s + r.outstanding, 0)
  const totalPaid = storeRows.reduce((s, r) => s + r.paid, 0)

  return (
    <div>
      <div className="mb-4 flex items-center gap-1.5 text-sm text-espresso/50">
        <Link to="/finance/customer-payments" className="hover:text-oven-amber">Customer Payments</Link>
        <span>/</span>
        <span className="text-espresso">{area.name}</span>
      </div>

      <PageHeader eyebrow="Finance / Customer Payments" title={area.name} description={`${areaStores.length} ${areaStores.length === 1 ? 'store' : 'stores'} in this area`}
        actions={<Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> Add payment</Button>} />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-4">
        <StatCard label="Outstanding" value={`₹${totalOutstanding.toLocaleString('en-IN')}`} icon={MapPin} chipColor="bg-cherry-compote/15 text-cherry-compote" danger={totalOutstanding > 0} />
        <StatCard label="Paid" value={`₹${totalPaid.toLocaleString('en-IN')}`} icon={Store} chipColor="bg-matcha-glaze/15 text-matcha-glaze" />
      </div>

      {storeRows.length === 0 ? (
        <EmptyState icon={Store} title="No stores in this area" description="Add stores to this area first." />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-bakery border border-espresso/8 bg-proof-cream shadow-bakery lg:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-espresso/10 bg-crust/30 text-left">
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Store</th>
                  <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-espresso/50">Total Billed</th>
                  <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-espresso/50">Paid</th>
                  <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-espresso/50">Outstanding</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Status</th>
                  <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-espresso/50"></th>
                </tr>
              </thead>
              <tbody>
                {storeRows.map((r) => (
                  <tr key={r.store.id} className="border-b border-espresso/8 last:border-0 hover:bg-crust/20">
                    <td className="px-4 py-3 font-medium text-espresso">{r.store.dealerName}</td>
                    <td className="px-4 py-3 text-right font-mono text-espresso/70">₹{r.totalBilled.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right font-mono text-matcha-glaze">₹{r.paid.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right font-mono text-cherry-compote">₹{r.outstanding.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3"><PaidBadge status={r.outstanding > 0 ? 'outstanding' : (r.totalBilled > 0 ? 'paid' : 'outstanding')} /></td>
                    <td className="px-4 py-3 text-right">
                      <Link to="/finance/customer-payments/$areaId/$storeId" params={{ areaId, storeId: r.store.id }}
                        className="inline-flex items-center gap-1 text-xs font-medium text-oven-amber hover:underline">
                        History <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="flex flex-col gap-3 lg:hidden">
            {storeRows.map((r) => (
              <Link key={r.store.id} to="/finance/customer-payments/$areaId/$storeId" params={{ areaId, storeId: r.store.id }}
                className="rounded-bakery border border-espresso/8 bg-proof-cream p-4 shadow-bakery transition hover:shadow-bakery-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-espresso">{r.store.dealerName}</p>
                    <p className="text-xs text-espresso/50">{r.store.storeType}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-espresso/30" />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div><p className="font-mono text-[10px] uppercase text-espresso/40">Billed</p><p className="font-mono text-sm font-bold text-espresso">₹{r.totalBilled.toLocaleString('en-IN')}</p></div>
                  <div><p className="font-mono text-[10px] uppercase text-espresso/40">Paid</p><p className="font-mono text-sm font-bold text-matcha-glaze">₹{r.paid.toLocaleString('en-IN')}</p></div>
                  <div><p className="font-mono text-[10px] uppercase text-espresso/40">Outstanding</p><p className="font-mono text-sm font-bold text-cherry-compote">₹{r.outstanding.toLocaleString('en-IN')}</p></div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      <AddPaymentModal open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={addCustomerPayment} stores={stores} areas={areas} />
    </div>
  )
}

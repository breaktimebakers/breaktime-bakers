import { Phone } from 'lucide-react'
import { STORE_DELIVERY_STATUS } from '@/constants/deliveryStatus'
import { Pagination } from '@/components/shared'
import { usePagination } from '@/hooks'

const PAGE_SIZE = 10

const STATUS_CLASS = {
  no_orders: 'bg-espresso/5 text-espresso/45',
  pending: 'bg-oven-amber/15 text-oven-amber',
  partial: 'bg-berry-jam/15 text-berry-jam',
  delivered: 'bg-matcha-glaze/15 text-matcha-glaze',
}

function StatusBadge({ status }) {
  const statusInfo = STORE_DELIVERY_STATUS[status]
  const StatusIcon = statusInfo.icon
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_CLASS[status]}`}><StatusIcon className="h-3.5 w-3.5" />{statusInfo.label}</span>
}

function orderLabel(order) {
  return order.items.map((item) => `${item.productName} × ${item.quantity}${item.unit}`).join(', ')
}

export function DriverStoresTable({ stores }) {
  // Resets to page 1 whenever the store list itself changes (switching
  // area tabs, picking a different date) - not just when its length does,
  // since two areas can happen to have the same number of stores.
  const resetKey = stores.map((store) => store.storeId).join(',')
  const { page, setPage, totalPages, start, end } = usePagination(stores.length, PAGE_SIZE, resetKey)
  const pagedStores = stores.slice(start, end)

  return (
    <div className="overflow-hidden rounded-bakery border border-espresso/8 bg-proof-cream shadow-bakery">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left">
        <thead className="border-b border-espresso/8 bg-crust/25">
          <tr className="font-mono text-[10px] uppercase tracking-wider text-espresso/45">
            <th className="px-5 py-3 font-medium">Store</th>
            <th className="px-4 py-3 font-medium">Contact</th>
            <th className="px-4 py-3 font-medium">Orders</th>
            <th className="px-5 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-espresso/6">
          {pagedStores.map((store) => (
            <tr key={store.storeId} className="transition hover:bg-crust/20">
              <td className="px-5 py-4">
                <p className="font-medium text-espresso">{store.storeName}</p>
                {store.shopName && <p className="mt-0.5 text-xs text-espresso/50">{store.shopName}</p>}
              </td>
              <td className="px-4 py-4 text-sm text-espresso/60">
                {store.phone ? <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{store.phone}</span> : '—'}
              </td>
              <td className="px-4 py-4">
                {store.orders.length === 0 ? <span className="text-sm text-espresso/40">No orders</span> : <ul className="max-w-sm space-y-1 text-xs text-espresso/65">{store.orders.map((order) => <li key={order.id}>{orderLabel(order)}</li>)}</ul>}
              </td>
              <td className="px-5 py-4"><StatusBadge status={store.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={stores.length} pageSize={PAGE_SIZE} />
    </div>
  )
}

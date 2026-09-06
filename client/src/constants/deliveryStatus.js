import { Circle, CircleDot, PackageCheck, CircleCheck } from 'lucide-react'

// A store's delivery status is never stored - it's derived from that
// store's orders for the date being viewed (see driver.service.js on the
// server). "No orders" is its own state, distinct from "pending": an
// assigned store with nothing placed against it today isn't a delivery
// waiting to happen.
export const STORE_DELIVERY_STATUS = {
  no_orders: { label: 'No orders', icon: Circle, color: 'text-espresso/40' },
  pending: { label: 'Pending', icon: CircleDot, color: 'text-oven-amber' },
  partial: { label: 'Partial', icon: PackageCheck, color: 'text-berry-jam' },
  delivered: { label: 'Delivered', icon: CircleCheck, color: 'text-matcha-glaze' },
}

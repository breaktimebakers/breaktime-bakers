import { Truck, PackageCheck, CircleCheck } from 'lucide-react'

export const ORDER_STATUS = {
  in_transit: { label: 'In Transit', icon: Truck, color: 'text-oven-amber', stampClass: 'text-oven-amber' },
  shipped: { label: 'Shipped', icon: PackageCheck, color: 'text-berry-jam', stampClass: 'text-berry-jam' },
  delivered: { label: 'Delivered', icon: CircleCheck, color: 'text-matcha-glaze', stampClass: 'text-matcha-glaze' },
}

export const ORDER_STATUS_KEYS = Object.keys(ORDER_STATUS)

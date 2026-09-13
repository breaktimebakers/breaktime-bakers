import { ClipboardList, Truck } from 'lucide-react'
import { PageHeader, EmptyState } from '@/components/shared'

export default function RegisterStaff() {
  return (
    <div>
      <PageHeader
        eyebrow="Register"
        title="Staff"
        description="Order takers and delivery drivers will get their own companion app. Registration opens here once it ships."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-bakery border border-espresso/10 bg-proof-cream p-6 shadow-bakery">
          <EmptyState
            icon={ClipboardList}
            title="Order Takers"
            description="Coming soon — register order takers once their app is ready."
          />
        </div>
        <div className="rounded-bakery border border-espresso/10 bg-proof-cream p-6 shadow-bakery">
          <EmptyState
            icon={Truck}
            title="Delivery"
            description="Coming soon — register delivery drivers once their app is ready."
          />
        </div>
      </div>
    </div>
  )
}

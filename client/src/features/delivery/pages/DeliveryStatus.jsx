import { PageHeader } from '@/components/shared'
import { DeliveryStatusTable } from '../components/DeliveryStatusTable'

export default function DeliveryStatus() {
  return (
    <div>
      <PageHeader
        eyebrow="Delivery / Status"
        title="Delivery status"
        description="Track every assigned store by area, delivery guy, and delivery progress."
      />
      <DeliveryStatusTable />
    </div>
  )
}

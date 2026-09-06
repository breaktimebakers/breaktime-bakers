import { Link } from '@tanstack/react-router'
import { Truck, UserRound, MapPin, ClipboardList, ArrowRight } from 'lucide-react'
import { useDeliveryScheduleToday } from '@/features/delivery/hooks'
import { ErrorState, PageHeader, StatCard } from '@/components/shared'

function NavCard({ to, icon: Icon, title, description, linkLabel }) {
  return (
    <Link to={to} className="group flex flex-col rounded-bakery border border-espresso/8 bg-proof-cream p-6 shadow-bakery transition-all hover:-translate-y-0.5 hover:shadow-bakery-lg">
      <div className="flex h-12 w-12 items-center justify-center rounded-bakery bg-oven-amber/15 text-oven-amber"><Icon className="h-6 w-6" /></div>
      <h3 className="mt-4 font-display text-xl font-semibold text-espresso">{title}</h3>
      <p className="mt-1 flex-1 text-sm text-espresso/55">{description}</p>
      <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-oven-amber">{linkLabel}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
    </Link>
  )
}

export default function DeliveryOverview() {
  const { data: schedule, isLoading, isError, isFetching, refetch } = useDeliveryScheduleToday()
  const assignments = schedule?.assignments || []
  const activeDrivers = assignments.filter((a) => a.canAssign)
  const assignedToday = assignments.filter((a) => a.areas.length > 0)
  const areasToday = new Set(assignments.flatMap((a) => a.areas.map((area) => area.id))).size

  return (
    <div>
      <PageHeader eyebrow="Delivery / Overview" title="Delivery" description="Manage drivers and see who's covering which area today." />

      {isError ? (
        <ErrorState description="Could not load today's delivery schedule." onRetry={refetch} retrying={isFetching} />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          <StatCard label="Active drivers" value={isLoading ? '—' : activeDrivers.length} icon={UserRound} chipColor="bg-sourdough/50 text-espresso" />
          <StatCard label="Assigned today" value={isLoading ? '—' : assignedToday.length} icon={Truck} chipColor="bg-oven-amber/15 text-oven-amber" />
          <StatCard label="Areas covered today" value={isLoading ? '—' : areasToday} icon={MapPin} chipColor="bg-matcha-glaze/20 text-matcha-glaze" />
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2">
        <NavCard to="/delivery/status" icon={ClipboardList} title="Delivery status" description="See every store's delivery progress by area and delivery guy." linkLabel="View status" />
        <NavCard to="/delivery/drivers" icon={UserRound} title="Drivers" description="Assign areas to drivers for a date, and manage delivery coverage." linkLabel="Manage" />
      </div>
    </div>
  )
}

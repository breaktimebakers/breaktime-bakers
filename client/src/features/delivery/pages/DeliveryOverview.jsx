import { Link } from '@tanstack/react-router'
import { Truck, UserRound, Route, ArrowRight, CircleCheck, CircleDot } from 'lucide-react'
import { useDelivery } from '@/features/delivery/hooks'
import { useSales } from '@/features/sales/hooks'
import { PageHeader } from '@/components/shared'

function StatCard({ label, value, icon: Icon, chipColor }) {
  return (
    <div className="rounded-bakery border border-espresso/8 bg-proof-cream p-4 shadow-bakery transition-all hover:-translate-y-0.5 hover:shadow-bakery-lg sm:p-5">
      <div className="flex items-start justify-between">
        <div><p className="font-mono text-[10px] uppercase tracking-wider text-espresso/50">{label}</p><p className="mt-1.5 font-mono text-2xl font-bold text-espresso sm:text-3xl">{value}</p></div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-bakery ${chipColor}`}><Icon className="h-5 w-5" /></div>
      </div>
    </div>
  )
}

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
  const { drivers, trips } = useDelivery()
  const { orders } = useSales()
  const today = new Date().toISOString().slice(0, 10)
  const tripsToday = trips.filter((t) => t.date === today)
  const todayOrders = orders.filter((o) => tripsToday.flatMap((t) => t.orderIds).includes(o.id))
  const pending = todayOrders.filter((o) => o.status !== 'delivered').length
  const completed = todayOrders.filter((o) => o.status === 'delivered').length

  return (
    <div>
      <PageHeader eyebrow="Delivery / Overview" title="Delivery" description="Manage drivers, plan trips, and track deliveries." />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Total drivers" value={drivers.length} icon={UserRound} chipColor="bg-sourdough/50 text-espresso" />
        <StatCard label="Trips today" value={tripsToday.length} icon={Truck} chipColor="bg-oven-amber/15 text-oven-amber" />
        <StatCard label="Stops pending today" value={pending} icon={CircleDot} chipColor="bg-cherry-compote/15 text-cherry-compote" />
        <StatCard label="Stops completed today" value={completed} icon={CircleCheck} chipColor="bg-matcha-glaze/20 text-matcha-glaze" />
      </div>

      <div className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2 sm:gap-6">
        <NavCard to="/delivery/drivers" icon={UserRound} title="Drivers" description="Manage drivers and their assigned delivery territories." linkLabel="Manage" />
        <NavCard to="/delivery/trips" icon={Route} title="Trips" description="Plan delivery trips and track stop-by-stop progress." linkLabel="View" />
      </div>
    </div>
  )
}

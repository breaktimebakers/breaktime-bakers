import { createRoute } from '@tanstack/react-router'
import { rootRoute } from '@/router/rootRoute'

import DeliveryOverview from './pages/DeliveryOverview'
import DriversList from './pages/DriversList'
import DriverDetail from './pages/DriverDetail'
import TripsList from './pages/TripsList'
import TripDetail from './pages/TripDetail'

const deliveryRoute = createRoute({ getParentRoute: () => rootRoute, path: '/delivery', component: DeliveryOverview })
const driversRoute = createRoute({ getParentRoute: () => rootRoute, path: '/delivery/drivers', component: DriversList })
const driverDetailRoute = createRoute({ getParentRoute: () => rootRoute, path: '/delivery/drivers/$driverId', component: DriverDetail })
const tripsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/delivery/trips', component: TripsList })
const tripDetailRoute = createRoute({ getParentRoute: () => rootRoute, path: '/delivery/trips/$tripId', component: TripDetail })

export const deliveryRoutes = [
  deliveryRoute,
  driversRoute,
  driverDetailRoute,
  tripsRoute,
  tripDetailRoute,
]

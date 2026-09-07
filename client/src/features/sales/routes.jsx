import { createRoute } from '@tanstack/react-router'
import { appLayoutRoute } from '@/router/appLayoutRoute'

import SalesOverview from './pages/SalesOverview'
import AreasList from './pages/AreasList'
import AreaDetail from './pages/AreaDetail'
import OrdersOverview from './pages/OrdersOverview'
import OrdersAreaList from './pages/OrdersAreaList'
import OrderTakersList from './pages/OrderTakersList'
import OrderTakerDetail from './pages/OrderTakerDetail'
import OrderTakerSchedule from './pages/OrderTakerSchedule'

const salesRoute = createRoute({ getParentRoute: () => appLayoutRoute, path: '/sales', component: SalesOverview })
const areasRoute = createRoute({ getParentRoute: () => appLayoutRoute, path: '/sales/areas', component: AreasList })
const areaDetailRoute = createRoute({ getParentRoute: () => appLayoutRoute, path: '/sales/areas/$areaId', component: AreaDetail })
const ordersRoute = createRoute({ getParentRoute: () => appLayoutRoute, path: '/sales/orders', component: OrdersAreaList })
// storeId/date are optional deep-link params - the Delivery Status table
// links here with both set so an admin lands with the right store+date
// filter already applied, instead of a bare area-scoped list.
const ordersAreaRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/sales/orders/$areaId',
  component: OrdersOverview,
  validateSearch: (search) => ({
    storeId: typeof search?.storeId === 'string' ? search.storeId : undefined,
    date: typeof search?.date === 'string' ? search.date : undefined,
  }),
})
const orderTakersRoute = createRoute({ getParentRoute: () => appLayoutRoute, path: '/sales/orders/order-takers', component: OrderTakersList })
const orderTakerScheduleRoute = createRoute({ getParentRoute: () => appLayoutRoute, path: '/sales/orders/order-takers/schedule', component: OrderTakerSchedule })
const orderTakerDetailRoute = createRoute({ getParentRoute: () => appLayoutRoute, path: '/sales/orders/order-takers/$personId', component: OrderTakerDetail })

export const salesRoutes = [
  salesRoute,
  areasRoute,
  areaDetailRoute,
  ordersRoute,
  ordersAreaRoute,
  orderTakersRoute,
  orderTakerScheduleRoute,
  orderTakerDetailRoute,
]

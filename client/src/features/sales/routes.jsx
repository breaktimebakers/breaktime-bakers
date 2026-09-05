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
const ordersAreaRoute = createRoute({ getParentRoute: () => appLayoutRoute, path: '/sales/orders/$areaId', component: OrdersOverview })
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

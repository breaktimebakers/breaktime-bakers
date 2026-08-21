import { createRoute } from '@tanstack/react-router'
import { rootRoute } from '@/router/rootRoute'

import SalesOverview from './pages/SalesOverview'
import AreasList from './pages/AreasList'
import AreaDetail from './pages/AreaDetail'
import OrdersOverview from './pages/OrdersOverview'
import OrdersAreaList from './pages/OrdersAreaList'
import OrderTakersList from './pages/OrderTakersList'
import OrderTakerDetail from './pages/OrderTakerDetail'

const salesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/sales', component: SalesOverview })
const areasRoute = createRoute({ getParentRoute: () => rootRoute, path: '/sales/areas', component: AreasList })
const areaDetailRoute = createRoute({ getParentRoute: () => rootRoute, path: '/sales/areas/$areaId', component: AreaDetail })
const ordersRoute = createRoute({ getParentRoute: () => rootRoute, path: '/sales/orders', component: OrdersAreaList })
const ordersAreaRoute = createRoute({ getParentRoute: () => rootRoute, path: '/sales/orders/$areaId', component: OrdersOverview })
const orderTakersRoute = createRoute({ getParentRoute: () => rootRoute, path: '/sales/orders/order-takers', component: OrderTakersList })
const orderTakerDetailRoute = createRoute({ getParentRoute: () => rootRoute, path: '/sales/orders/order-takers/$personId', component: OrderTakerDetail })

export const salesRoutes = [
  salesRoute,
  areasRoute,
  areaDetailRoute,
  ordersRoute,
  ordersAreaRoute,
  orderTakersRoute,
  orderTakerDetailRoute,
]

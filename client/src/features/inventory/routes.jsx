import { createRoute } from '@tanstack/react-router'
import { rootRoute } from '@/router/rootRoute'

import InventoryDashboard from './pages/InventoryDashboard'
import RawMaterials from './pages/RawMaterials'
import InProcess from './pages/InProcess'
import ReadyStock from './pages/ReadyStock'

const inventoryRoute = createRoute({ getParentRoute: () => rootRoute, path: '/inventory', component: InventoryDashboard })
const rawMaterialsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/inventory/raw-materials', component: RawMaterials })
const inProcessRoute = createRoute({ getParentRoute: () => rootRoute, path: '/inventory/in-process', component: InProcess })
const readyStockRoute = createRoute({ getParentRoute: () => rootRoute, path: '/inventory/ready', component: ReadyStock })

export const inventoryRoutes = [
  inventoryRoute,
  rawMaterialsRoute,
  inProcessRoute,
  readyStockRoute,
]

import { createRoute } from '@tanstack/react-router'
import { appLayoutRoute } from '@/router/appLayoutRoute'

import InventoryDashboard from './pages/InventoryDashboard'
import RawMaterials from './pages/RawMaterials'
import InProcess from './pages/InProcess'
import ReadyStock from './pages/ReadyStock'

const inventoryRoute = createRoute({ getParentRoute: () => appLayoutRoute, path: '/inventory', component: InventoryDashboard })
const rawMaterialsRoute = createRoute({ getParentRoute: () => appLayoutRoute, path: '/inventory/raw-materials', component: RawMaterials })
const inProcessRoute = createRoute({ getParentRoute: () => appLayoutRoute, path: '/inventory/in-process', component: InProcess })
const readyStockRoute = createRoute({ getParentRoute: () => appLayoutRoute, path: '/inventory/ready', component: ReadyStock })

export const inventoryRoutes = [
  inventoryRoute,
  rawMaterialsRoute,
  inProcessRoute,
  readyStockRoute,
]

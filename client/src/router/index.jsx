import { createRoute, createRouter, redirect } from '@tanstack/react-router'
import { rootRoute } from './rootRoute'
import { fullPageLayoutRoute } from './fullPageLayoutRoute'
import { appLayoutRoute } from './appLayoutRoute'

import { authRoutes } from '@/features/auth/routes'
import { inventoryRoutes } from '@/features/inventory/routes'
import { salesRoutes } from '@/features/sales/routes'
import { deliveryRoutes } from '@/features/delivery/routes'
import { workersRoutes } from '@/features/workers/routes'
import { financeRoutes } from '@/features/finance/routes'

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => { throw redirect({ to: '/inventory' }) },
  component: () => null,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  fullPageLayoutRoute.addChildren([...authRoutes]),
  appLayoutRoute.addChildren([
    ...inventoryRoutes,
    ...salesRoutes,
    ...deliveryRoutes,
    ...workersRoutes,
    ...financeRoutes,
  ]),
])

export const router = createRouter({ routeTree })

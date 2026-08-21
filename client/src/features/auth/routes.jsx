import { createRoute } from '@tanstack/react-router'
import { rootRoute } from '@/router/rootRoute'

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: () => null,
})

export const authRoutes = [
  loginRoute,
]

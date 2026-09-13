import { createRoute, redirect } from '@tanstack/react-router'
import { appLayoutRoute } from '@/router/appLayoutRoute'

import RegisterAdmin from './pages/RegisterAdmin'
import RegisterStaff from './pages/RegisterStaff'

const registerIndexRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/register',
  beforeLoad: () => { throw redirect({ to: '/register/admin' }) },
  component: () => null,
})
const registerAdminRoute = createRoute({ getParentRoute: () => appLayoutRoute, path: '/register/admin', component: RegisterAdmin })
const registerStaffRoute = createRoute({ getParentRoute: () => appLayoutRoute, path: '/register/staff', component: RegisterStaff })

export const registerRoutes = [
  registerIndexRoute,
  registerAdminRoute,
  registerStaffRoute,
]

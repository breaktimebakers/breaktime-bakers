import { Outlet, createRoute } from '@tanstack/react-router'
import { rootRoute } from './rootRoute'

// Layout for unauthenticated screens (login, register, ...). No chrome of
// its own - each page under it (e.g. Login) owns its own full-screen shell.
export const fullPageLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'full-page-layout',
  component: () => <Outlet />,
})

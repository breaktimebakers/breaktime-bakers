import { Outlet, createRoute, redirect } from '@tanstack/react-router'
import { rootRoute } from './rootRoute'
import { AppShell } from '@/components/layout/AppShell'
import { queryClient } from '@/lib/queryClient'
import { AUTH_ME_STALE_TIME_MS, authKeys, fetchCurrentUser } from '@/features/auth/hooks/useAuth'

// Every navigation into the admin panel re-checks the session with the
// server before the route is allowed to load, so a logged-out visitor -
// or one whose session expired server-side - is bounced to /login
// instead of ever rendering a protected page.
//
// Goes through the shared queryClient instead of a raw fetch so this
// check populates the same cache entry AppShell's useAuth() reads.
// The auth check uses a short cache window so sidebar navigation doesn't
// call /me on every click, while still revalidating regularly and on
// focus/reconnect through React Query.
export const appLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'app-layout',

  beforeLoad: async () => {
    let user

    try {
      user = await queryClient.query({
        queryKey: authKeys.me,
        queryFn: fetchCurrentUser,
        staleTime: AUTH_ME_STALE_TIME_MS,
      })
    } catch {
      throw redirect({ to: '/login' })
    }

    if (!user) throw redirect({ to: '/login' })
  },

  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
})

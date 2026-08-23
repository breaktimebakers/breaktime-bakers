import { Outlet, createRoute, redirect } from '@tanstack/react-router'
import { rootRoute } from './rootRoute'
import { AppProviders } from '@/providers/AppProviders'
import { AppShell } from '@/components/layout/AppShell'
import { queryClient } from '@/lib/queryClient'
import { authKeys, fetchCurrentUser } from '@/features/auth/hooks/useAuth'

// Every navigation into the admin panel re-checks the session with the
// server before the route is allowed to load, so a logged-out visitor -
// or one whose session expired server-side - is bounced to /login
// instead of ever rendering a protected page.
//
// Goes through the shared queryClient instead of a raw fetch so this
// check populates the same cache entry AppShell's useAuth() reads.
// staleTime: 0 forces an actual network call here every time - this is
// a security check, so a cached "was authenticated" from a previous
// navigation must never be trusted on its own (the session could have
// expired or been revoked server-side since). AppShell's useAuth() then
// sees this fresh value as its own cache is populated for free.
export const appLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'app-layout',

  beforeLoad: async () => {
    let user

    try {
      user = await queryClient.query({
        queryKey: authKeys.me,
        queryFn: fetchCurrentUser,
        staleTime: 0,
      })
    } catch {
      throw redirect({ to: '/login' })
    }

    if (!user) throw redirect({ to: '/login' })
  },

  component: () => (
    <AppProviders>
      <AppShell>
        <Outlet />
      </AppShell>
    </AppProviders>
  ),
})

import { router } from '@/router'
import { queryClient } from './queryClient'

// apiClient dispatches this when a refresh attempt fails (access token
// expired and the refresh token is gone/invalid) or a stolen/reused
// refresh token is detected server-side. Nobody was listening for it, so
// the user just saw a failed request while stuck on a protected page
// with stale UI. This wipes the cache (so no other admin's data lingers)
// and forces a real navigation to /login with a reason the page can show.
export function initSessionExpiryListener() {
  window.addEventListener('auth:session-expired', () => {
    queryClient.clear()

    if (router.state.location.pathname !== '/login') {
      router.navigate({ to: '/login', search: { sessionExpired: true } })
    }
  })
}

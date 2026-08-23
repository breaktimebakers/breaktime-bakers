import { QueryClient } from '@tanstack/react-query'

// staleTime/gcTime: 0 - data is refetched on every mount/focus/reconnect
// and dropped from memory the instant nothing is observing it. This app
// is a shared admin panel: several admins can edit the same records, so
// we favor always-fresh reads over cache hits. It does NOT mean changes
// push live to other open tabs - a query only refetches when something
// triggers it (mount, window focus, reconnect, or a manual invalidate
// after a mutation), so a screen left idle can still show stale data
// until one of those fires.
//
// Exported as a singleton (rather than created inline in main.jsx) so
// non-component code - route `beforeLoad` guards in particular - can
// read/seed the same cache instead of issuing its own duplicate fetch.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: 0,
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
})

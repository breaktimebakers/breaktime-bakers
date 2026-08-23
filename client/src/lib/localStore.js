import { useQuery } from '@tanstack/react-query'

// A React Query-backed replacement for Context+useState, for state that
// has no backend yet (still fully client-side mock data) but needs to
// persist for the life of the session the way a root-mounted Context
// Provider used to. staleTime/gcTime: Infinity so the seed value is read
// exactly once, ever, and the cache entry is never dropped just because
// every component reading it happened to unmount at the same time (e.g.
// navigating away from every page that uses it) - unlike real server
// data, where the app-wide staleTime/gcTime: 0 default (see
// lib/queryClient.js) is exactly what we want.
export function useLocalQuery(key, seed) {
  return useQuery({
    queryKey: key,
    queryFn: () => seed,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

// The "mutation" side: synchronously replaces the cached value, taking
// either a new value or an updater function over the previous one - the
// same shape a useState setter accepts. No network request, no
// invalidation - this is local-only state, not server state.
export function setLocalData(queryClient, key, updater) {
  queryClient.setQueryData(key, updater)
}

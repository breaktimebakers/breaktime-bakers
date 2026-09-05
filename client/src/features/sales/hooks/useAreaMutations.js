import { useMutation, useQueryClient } from '@tanstack/react-query'
import { areaApi, storeApi } from '../api/areaApi'
import { areaKeys, storeKeys } from './useAreas'
import { salesKeys } from './useSalesOverview'
import { toast } from '@/lib/toast'

const invalidateAreas = (queryClient) => Promise.all([
  queryClient.invalidateQueries({ queryKey: areaKeys.all }),
  queryClient.invalidateQueries({ queryKey: salesKeys.overview }),
])

// Store data is also cached separately under storeKeys (useAllStores,
// useUnassignedStores) for consumers that aren't scoped to one area, e.g.
// the Add/Fill Order pickers and the Areas page's unassigned-stores
// banner. areaKeys.all doesn't cover that branch, so anything that
// changes a store (not just its area) needs to invalidate both.
const invalidateAreasAndStores = (queryClient) => {
  invalidateAreas(queryClient)
  queryClient.invalidateQueries({ queryKey: storeKeys.all })
}

export function useCreateArea() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: areaApi.create,
    onSuccess: () => {
      invalidateAreas(queryClient)
      toast.success('Area added')
    },
    onError: (err) => {
      toast.error('Could not add area', { description: err.message })
    },
  })
}

export function useUpdateArea() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }) => areaApi.update(id, body),
    onSuccess: () => {
      invalidateAreas(queryClient)
      toast.success('Area updated')
    },
    onError: (err) => {
      toast.error('Could not update area', { description: err.message })
    },
  })
}

export function useCreateStore() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ areaId, body }) => areaApi.createStore(areaId, body),
    onSuccess: () => {
      // A new store changes both that area's store list and its
      // storeCount on the Areas grid, plus the standalone stores branch
      // (Add/Fill Order pickers) - invalidate both rather than
      // hand-patching separate caches.
      invalidateAreasAndStores(queryClient)
      toast.success('Store added')
    },
    onError: (err) => {
      toast.error('Could not add store', { description: err.message })
    },
  })
}

export function useUpdateStore() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }) => storeApi.update(id, body),
    onSuccess: () => {
      invalidateAreasAndStores(queryClient)
      toast.success('Store updated')
    },
    onError: (err) => {
      toast.error('Could not update store', { description: err.message })
    },
  })
}

export function useBulkAssignStores() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ storeIds, areaId }) => storeApi.bulkAssign(storeIds, areaId),
    onSuccess: (_data, { storeIds }) => {
      // Touches the target area's store list/count, the unassigned pool,
      // and (if these stores came from another area) that area's count
      // too - invalidate both branches rather than track all of them.
      invalidateAreasAndStores(queryClient)
      toast.success(`${storeIds.length} ${storeIds.length === 1 ? 'store' : 'stores'} assigned`)
    },
    onError: (err) => {
      toast.error('Could not assign stores', { description: err.message })
    },
  })
}

export function useBulkUnassignStores() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ storeIds }) => storeApi.bulkUnassign(storeIds),
    onSuccess: (_data, { storeIds }) => {
      invalidateAreasAndStores(queryClient)
      toast.success(`${storeIds.length} ${storeIds.length === 1 ? 'store' : 'stores'} removed from area`)
    },
    onError: (err) => {
      toast.error('Could not remove stores', { description: err.message })
    },
  })
}

export function useUpdateStoreStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }) => storeApi.updateStatus(id, isActive),
    onSuccess: (_data, { isActive }) => {
      invalidateAreasAndStores(queryClient)
      toast.success(isActive ? 'Store marked active' : 'Store marked inactive')
    },
    onError: (err) => {
      toast.error('Could not update store status', { description: err.message })
    },
  })
}

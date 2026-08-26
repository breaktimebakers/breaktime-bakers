import { useMutation, useQueryClient } from '@tanstack/react-query'
import { areaApi, storeApi } from '../api/areaApi'
import { areaKeys } from './useAreas'
import { toast } from '@/lib/toast'

const invalidateAreas = (queryClient) => queryClient.invalidateQueries({ queryKey: areaKeys.all })

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
      // storeCount on the Areas grid - invalidate the whole branch
      // rather than hand-patching two separate caches.
      invalidateAreas(queryClient)
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
      invalidateAreas(queryClient)
      toast.success('Store updated')
    },
    onError: (err) => {
      toast.error('Could not update store', { description: err.message })
    },
  })
}

export function useUpdateStoreStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }) => storeApi.updateStatus(id, isActive),
    onSuccess: (_data, { isActive }) => {
      invalidateAreas(queryClient)
      toast.success(isActive ? 'Store marked active' : 'Store marked inactive')
    },
    onError: (err) => {
      toast.error('Could not update store status', { description: err.message })
    },
  })
}

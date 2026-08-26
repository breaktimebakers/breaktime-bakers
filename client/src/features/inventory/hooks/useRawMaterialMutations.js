import { useMutation, useQueryClient } from '@tanstack/react-query'
import { rawMaterialApi } from '../api/rawMaterialApi'
import { rawMaterialKeys } from './useRawMaterials'
import { toast } from '@/lib/toast'

// Every mutation below invalidates the whole raw-materials branch of the
// cache (the list query and every material's lots query share the
// ['raw-materials', ...] prefix, so one invalidateQueries call catches
// both) rather than hand-patching the one row it touched. stockQty and
// nextLotRate are computed server-side from lots at read time, so a
// precise client-side patch would have to reimplement that logic; a
// refetch of whatever's currently on screen is cheap and can't drift.
const invalidateAll = (queryClient) => queryClient.invalidateQueries({ queryKey: rawMaterialKeys.all })

export function useCreateRawMaterial() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: rawMaterialApi.create,
    onSuccess: () => invalidateAll(queryClient),
  })
}

export function useUpdateRawMaterial() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }) => rawMaterialApi.update(id, body),
    onSuccess: () => invalidateAll(queryClient),
  })
}

export function useDeleteRawMaterial() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => rawMaterialApi.remove(id),
    onSuccess: () => {
      invalidateAll(queryClient)
      toast.success('Raw material deleted')
    },
    onError: (err) => {
      toast.error('Could not delete raw material', { description: err.message })
    },
  })
}

export function useCreateLot() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ materialId, body }) => rawMaterialApi.createLot(materialId, body),
    onSuccess: () => invalidateAll(queryClient),
  })
}

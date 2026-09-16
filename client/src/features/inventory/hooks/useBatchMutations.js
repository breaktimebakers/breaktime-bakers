import { useMutation, useQueryClient } from '@tanstack/react-query'
import { batchApi } from '../api/batchApi'
import { batchKeys } from './useBatches'
import { rawMaterialKeys } from './useRawMaterials'
import { readyStockKeys } from './useReadyStock'
import { formatCurrency } from '@/utils'
import { toast } from '@/lib/toast'

export function useCreateBatch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: batchApi.create,
    onSuccess: ({ batch }) => {
      // A batch also draws down raw_materials stock and credits ready
      // stock server-side, so both of those cache branches are stale too,
      // not just batches.
      queryClient.invalidateQueries({ queryKey: batchKeys.all })
      queryClient.invalidateQueries({ queryKey: rawMaterialKeys.all })
      queryClient.invalidateQueries({ queryKey: readyStockKeys.all })

      toast.success(`Batch of ${batch.productName} logged`, {
        description: `${formatCurrency(batch.totalIngredientCost)} of raw materials consumed.`,
      })
    },
    onError: (err) => {
      toast.error('Could not log batch', { description: err.message })
    },
  })
}

export function useUpdateBatch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, body }) => batchApi.update(id, body),
    onSuccess: ({ batch }) => {
      // Editing re-derives raw-material consumption and the batch's Ready
      // Stock movement from scratch server-side, same reasoning as
      // useCreateBatch's invalidation above.
      queryClient.invalidateQueries({ queryKey: batchKeys.all })
      queryClient.invalidateQueries({ queryKey: rawMaterialKeys.all })
      queryClient.invalidateQueries({ queryKey: readyStockKeys.all })

      toast.success(`Batch of ${batch.productName} updated`)
    },
    onError: (err) => {
      toast.error('Could not update batch', { description: err.message })
    },
  })
}

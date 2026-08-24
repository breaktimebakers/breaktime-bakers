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

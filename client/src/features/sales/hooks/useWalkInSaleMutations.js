import { useMutation, useQueryClient } from '@tanstack/react-query'
import { walkInSaleApi } from '../api/walkInSaleApi'
import { walkInSaleKeys } from './useWalkInSales'
import { readyStockKeys } from '@/features/inventory/hooks/useReadyStock'
import { toast } from '@/lib/toast'

const invalidateWalkInSales = (queryClient) => Promise.all([
  queryClient.invalidateQueries({ queryKey: walkInSaleKeys.all }),
  // Recording a sale draws down ready_stock_movements server-side, so
  // Ready Stock's cached availableQty is stale too - same reasoning as
  // useFulfillOrder in useOrderMutations.js.
  queryClient.invalidateQueries({ queryKey: readyStockKeys.all }),
])

export function useCreateWalkInSale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: walkInSaleApi.create,
    onSuccess: () => {
      invalidateWalkInSales(queryClient)
      toast.success('Walk-in sale recorded')
    },
    onError: (err) => {
      toast.error('Could not record sale', { description: err.message })
    },
  })
}

export function useSettleWalkInSale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => walkInSaleApi.settle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walkInSaleKeys.all })
      toast.success('Marked as paid')
    },
    onError: (err) => {
      toast.error('Could not update payment status', { description: err.message })
    },
  })
}

export function useRecordWalkInSalePayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, amount }) => walkInSaleApi.recordPayment(id, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walkInSaleKeys.all })
      toast.success('Payment recorded')
    },
    onError: (err) => {
      toast.error('Could not record payment', { description: err.message })
    },
  })
}

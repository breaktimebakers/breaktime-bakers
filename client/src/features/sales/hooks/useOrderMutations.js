import { useMutation, useQueryClient } from '@tanstack/react-query'
import { orderApi } from '../api/orderApi'
import { orderKeys } from './useOrders'
import { salesKeys } from './useSalesOverview'
import { readyStockKeys } from '@/features/inventory/hooks/useReadyStock'
import { customerPaymentKeys } from '@/features/finance/hooks/useCustomerPayments'
import { toast } from '@/lib/toast'

const invalidateOrders = (queryClient) => Promise.all([
  queryClient.invalidateQueries({ queryKey: orderKeys.all }),
  queryClient.invalidateQueries({ queryKey: salesKeys.overview }),
])

export function useCreateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: orderApi.create,
    onSuccess: () => {
      invalidateOrders(queryClient)
      toast.success('Order added')
    },
    onError: (err) => {
      toast.error('Could not add order', { description: err.message })
    },
  })
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }) => orderApi.updateStatus(id, status),
    onSuccess: () => {
      invalidateOrders(queryClient)
      toast.success('Order status updated')
    },
    onError: (err) => {
      toast.error('Could not update order status', { description: err.message })
    },
  })
}

export function useFulfillOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }) => orderApi.fulfill(id, body),
    onSuccess: () => {
      invalidateOrders(queryClient)
      // Fulfillment now also draws down ready_stock_movements server-side,
      // so Ready Stock's cached availableQty is stale too, not just orders.
      queryClient.invalidateQueries({ queryKey: readyStockKeys.all })
      // An optional amountCollected on this fulfillment may have logged an
      // order_payments row server-side - always invalidate rather than
      // checking the body, so Finance's Customer Payments never shows a
      // stale balance after a delivery collects money.
      queryClient.invalidateQueries({ queryKey: customerPaymentKeys.all })
      toast.success('Order fulfilled')
    },
    onError: (err) => {
      toast.error('Could not fulfill order', { description: err.message })
    },
  })
}

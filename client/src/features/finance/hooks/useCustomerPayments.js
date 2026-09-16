import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customerPaymentApi } from '../api/customerPaymentApi'
import { toast } from '@/lib/toast'

export const customerPaymentKeys = {
  all: ['customerPayments'],
  overview: ['customerPayments', 'overview'],
  periodTotal: (range = {}) => ['customerPayments', 'periodTotal', range],
  areas: ['customerPayments', 'areas'],
  areaStores: (areaId, query = {}) => ['customerPayments', 'areas', areaId, 'stores', query],
  store: (storeId) => ['customerPayments', 'store', storeId],
  order: (orderId) => ['customerPayments', 'order', orderId],
}

export function useCustomerPaymentsOverview() {
  return useQuery({
    queryKey: customerPaymentKeys.overview,
    queryFn: () => customerPaymentApi.overview(),
  })
}

// Cash collected within a bounded [from, to] - the P&L "Sales" line.
// range defaults to the current calendar month server-side when both
// from/to are omitted, same resolveMonthRange idiom as useAllLots.
export function usePaymentsPeriodTotal(range = {}) {
  return useQuery({
    queryKey: customerPaymentKeys.periodTotal(range),
    queryFn: () => customerPaymentApi.periodTotal(range),
  })
}

export function useAreaPaymentSummaries() {
  return useQuery({
    queryKey: customerPaymentKeys.areas,
    queryFn: async () => {
      const { areas } = await customerPaymentApi.areas()
      return areas
    },
  })
}

export function useAreaStoreSummaries(areaId, query = {}, { enabled = true } = {}) {
  return useQuery({
    queryKey: customerPaymentKeys.areaStores(areaId, query),
    queryFn: async () => {
      const { stores } = await customerPaymentApi.areaStores(areaId, query)
      return stores
    },
    enabled: !!areaId && enabled,
  })
}

export function useStorePaymentLedger(storeId) {
  return useQuery({
    queryKey: customerPaymentKeys.store(storeId),
    queryFn: () => customerPaymentApi.storeDetail(storeId),
    enabled: !!storeId,
  })
}

export function useOrderPayments(orderId) {
  return useQuery({
    queryKey: customerPaymentKeys.order(orderId),
    queryFn: async () => {
      const { payments } = await customerPaymentApi.listForOrder(orderId)
      return payments
    },
    enabled: !!orderId,
  })
}

export function useRecordOrderPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body) => customerPaymentApi.record(body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: customerPaymentKeys.all })
      queryClient.invalidateQueries({ queryKey: customerPaymentKeys.order(variables.orderId) })
      toast.success('Payment recorded')
    },
    onError: (err) => {
      toast.error('Could not record payment', { description: err.message })
    },
  })
}

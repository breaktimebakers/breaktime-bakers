import { useQuery } from '@tanstack/react-query'
import { deliveryApi } from '../api/deliveryApi'

export function useDeliveryStatus(query = {}, { enabled = true } = {}) {
  return useQuery({
    queryKey: ['delivery', 'status', query],
    queryFn: () => deliveryApi.getStatus(query),
    enabled,
  })
}

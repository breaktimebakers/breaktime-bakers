import { useQuery } from '@tanstack/react-query'
import { orderApi } from '../api/orderApi'

export const orderKeys = {
  all: ['orders'],
  list: (query = {}) => ['orders', 'list', query],
}

// query mirrors the backend's filters (filter/from/to/areaId/storeId/
// status/orderTakerId/productId) - filter defaults to "today" server-side
// when omitted, same as the backend default.
export function useOrders(query = {}) {
  return useQuery({
    queryKey: orderKeys.list(query),
    queryFn: async () => {
      const { orders } = await orderApi.list(query)
      return orders
    },
  })
}

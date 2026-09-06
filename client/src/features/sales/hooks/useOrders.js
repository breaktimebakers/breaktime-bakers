import { useQuery } from '@tanstack/react-query'
import { orderApi } from '../api/orderApi'

export const orderKeys = {
  all: ['orders'],
  list: (query = {}) => ['orders', 'list', query],
}

// query mirrors the backend's filters (filter/from/to/areaId/storeId/
// status/orderTakerId/productId) - filter defaults to "today" server-side
// when omitted, same as the backend default.
// `enabled` lets a caller hold off firing the request while a required
// date input is incomplete or invalid (e.g. "specific date" chosen but no
// date picked yet, or a custom range with `from` after `to`) - without
// it, an incomplete filter either issues a misleadingly wide/empty query
// or gets rejected by the backend's date validation before the user has
// finished picking dates.
export function useOrders(query = {}, { enabled = true } = {}) {
  return useQuery({
    queryKey: orderKeys.list(query),
    queryFn: async () => {
      const { orders } = await orderApi.list(query)
      return orders
    },
    enabled,
  })
}

export function usePaginatedOrders(query = {}) {
  const params = { ...query, page: query.page ?? 1, pageSize: query.pageSize ?? 10 }

  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => orderApi.list(params),
  })
}

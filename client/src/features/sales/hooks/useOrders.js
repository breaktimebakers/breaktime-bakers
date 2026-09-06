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

// `enabled` mirrors useOrders' - hold off firing while a required date
// input is incomplete or invalid, see useOrders.js above.
export function usePaginatedOrders(query = {}, { enabled = true } = {}) {
  const params = { ...query, page: query.page ?? 1, pageSize: query.pageSize ?? 10 }

  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => orderApi.list(params),
    enabled,
  })
}

// Stat cards + both charts on the order taker detail page - one lightweight
// aggregate query covering this taker's entire history, independent of
// whatever page/filter the orders table on that same page is showing.
export function useOrderTakerStats(orderTakerId, range) {
  return useQuery({
    queryKey: ['orders', 'orderTakerStats', orderTakerId, range],
    queryFn: () => orderApi.getOrderTakerStats(orderTakerId, range),
    enabled: Boolean(orderTakerId),
  })
}

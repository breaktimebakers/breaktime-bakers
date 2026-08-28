import { useQuery } from '@tanstack/react-query'
import { readyStockApi } from '../api/readyStockApi'

export const readyStockKeys = {
  all: ['ready-stock'],
  list: (query = {}) => ['ready-stock', 'list', query],
  history: (productId, range = {}) => ['ready-stock', productId, 'history', range],
}

export function useReadyStock(query = {}) {
  return useQuery({
    queryKey: readyStockKeys.list(query),
    // apiClient resolves to the response envelope's `data`, which for
    // this endpoint is { readyStock: [...] } - unwrapped so callers get
    // the bare array back.
    queryFn: async () => {
      const { readyStock } = await readyStockApi.list(query)
      return readyStock
    },
  })
}

// Lazy by design - a product's incoming stock history is only fetched
// once its row is expanded, not for every row up front on page load.
// Same pattern as useRawMaterialLots.
export function useProductStockHistory(productId, range = {}, { enabled = true } = {}) {
  return useQuery({
    queryKey: readyStockKeys.history(productId, range),
    queryFn: async () => {
      const { history } = await readyStockApi.history(productId, range)
      return history
    },
    enabled: enabled && !!productId,
  })
}

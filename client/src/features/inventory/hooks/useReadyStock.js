import { useQuery } from '@tanstack/react-query'
import { readyStockApi } from '../api/readyStockApi'

export const readyStockKeys = {
  all: ['ready-stock'],
  list: (query = {}) => ['ready-stock', 'list', query],
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

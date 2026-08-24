import { useQuery } from '@tanstack/react-query'
import { batchApi } from '../api/batchApi'

export const batchKeys = {
  all: ['batches'],
  list: (query = {}) => ['batches', 'list', query],
}

export function useBatches(query = {}) {
  return useQuery({
    queryKey: batchKeys.list(query),
    // apiClient resolves to the response envelope's `data`, which for
    // this endpoint is { batches: [...] } - unwrapped here so callers get
    // the bare array back.
    queryFn: async () => {
      const { batches } = await batchApi.list(query)
      return batches
    },
  })
}

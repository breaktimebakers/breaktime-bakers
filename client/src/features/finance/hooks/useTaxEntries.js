import { useQuery } from '@tanstack/react-query'
import { taxEntryApi } from '../api/taxEntryApi'

export const taxEntryKeys = {
  all: ['taxEntries'],
  list: ['taxEntries', 'list'],
}

export function useTaxEntries() {
  return useQuery({
    queryKey: taxEntryKeys.list,
    queryFn: async () => {
      const { taxEntries } = await taxEntryApi.list()
      return taxEntries
    },
  })
}

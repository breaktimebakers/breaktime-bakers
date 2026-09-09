import { useQuery } from '@tanstack/react-query'
import { storeVisitNoteApi } from '../api/storeVisitNoteApi'

export const storeVisitNoteKeys = {
  all: ['storeVisitNotes'],
  list: (query = {}) => ['storeVisitNotes', 'list', query],
}

export function useStoreVisitNotes(query = {}, { enabled = true } = {}) {
  return useQuery({
    queryKey: storeVisitNoteKeys.list(query),
    queryFn: async () => {
      const { storeVisitNotes } = await storeVisitNoteApi.list(query)
      return storeVisitNotes
    },
    enabled,
  })
}

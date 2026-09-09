import { useMutation, useQueryClient } from '@tanstack/react-query'
import { storeVisitNoteApi } from '../api/storeVisitNoteApi'
import { storeVisitNoteKeys } from './useStoreVisitNotes'
import { toast } from '@/lib/toast'

export function useCreateStoreVisitNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: storeVisitNoteApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storeVisitNoteKeys.all })
      toast.success('Store marked closed')
    },
    onError: (err) => {
      toast.error('Could not mark store closed', { description: err.message })
    },
  })
}

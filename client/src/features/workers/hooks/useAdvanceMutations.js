import { useMutation, useQueryClient } from '@tanstack/react-query'
import { advanceApi } from '../api/workerApi'
import { advanceKeys } from './useAdvances'
import { toast } from '@/lib/toast'

const invalidateAdvances = (queryClient) => queryClient.invalidateQueries({ queryKey: advanceKeys.all })

export function useCreateAdvance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: advanceApi.create,
    onSuccess: () => {
      invalidateAdvances(queryClient)
      toast.success('Advance recorded')
    },
    onError: (err) => {
      toast.error('Could not record advance', { description: err.message })
    },
  })
}

export function useDeleteAdvance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => advanceApi.remove(id),
    onSuccess: () => {
      invalidateAdvances(queryClient)
      toast.success('Advance deleted')
    },
    onError: (err) => {
      toast.error('Could not delete advance', { description: err.message })
    },
  })
}

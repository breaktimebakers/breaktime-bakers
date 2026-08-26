import { useMutation, useQueryClient } from '@tanstack/react-query'
import { taxEntryApi } from '../api/taxEntryApi'
import { taxEntryKeys } from './useTaxEntries'
import { toast } from '@/lib/toast'

const invalidateTaxEntries = (queryClient) => queryClient.invalidateQueries({ queryKey: taxEntryKeys.all })

export function useCreateTaxEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: taxEntryApi.create,
    onSuccess: () => {
      invalidateTaxEntries(queryClient)
      toast.success('Tax entry added')
    },
    onError: (err) => {
      toast.error('Could not add tax entry', { description: err.message })
    },
  })
}

export function useDeleteTaxEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => taxEntryApi.remove(id),
    onSuccess: () => {
      invalidateTaxEntries(queryClient)
      toast.success('Tax entry deleted')
    },
    onError: (err) => {
      toast.error('Could not delete tax entry', { description: err.message })
    },
  })
}

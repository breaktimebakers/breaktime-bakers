import { useMutation, useQueryClient } from '@tanstack/react-query'
import { salaryPaymentApi } from '../api/salaryPaymentApi'
import { salaryPaymentKeys } from './useSalaryPayments'
import { toast } from '@/lib/toast'

const invalidateSalaryPayments = (queryClient) => queryClient.invalidateQueries({ queryKey: salaryPaymentKeys.all })

export function useMarkSalaryPaid() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: salaryPaymentApi.markPaid,
    onSuccess: () => {
      invalidateSalaryPayments(queryClient)
      toast.success('Marked as paid')
    },
    onError: (err) => {
      toast.error('Could not mark as paid', { description: err.message })
    },
  })
}

export function useBulkMarkSalaryPaid() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: salaryPaymentApi.bulkMarkPaid,
    onSuccess: () => {
      invalidateSalaryPayments(queryClient)
      toast.success('Workers marked as paid')
    },
    onError: (err) => {
      toast.error('Could not mark workers as paid', { description: err.message })
    },
  })
}

export function useMarkSalaryUnpaid() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ workerId, year, month }) => salaryPaymentApi.markUnpaid(workerId, year, month),
    onSuccess: () => {
      invalidateSalaryPayments(queryClient)
      toast.success('Marked as unpaid')
    },
    onError: (err) => {
      toast.error('Could not mark as unpaid', { description: err.message })
    },
  })
}

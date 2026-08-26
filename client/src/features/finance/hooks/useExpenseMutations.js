import { useMutation, useQueryClient } from '@tanstack/react-query'
import { expenseApi } from '../api/expenseApi'
import { expenseKeys } from './useExpenses'
import { toast } from '@/lib/toast'

const invalidateExpenses = (queryClient) => queryClient.invalidateQueries({ queryKey: expenseKeys.all })

export function useCreateExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: expenseApi.create,
    onSuccess: () => {
      invalidateExpenses(queryClient)
      toast.success('Expense added')
    },
    onError: (err) => {
      toast.error('Could not add expense', { description: err.message })
    },
  })
}

export function useDeleteExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => expenseApi.remove(id),
    onSuccess: () => {
      invalidateExpenses(queryClient)
      toast.success('Expense deleted')
    },
    onError: (err) => {
      toast.error('Could not delete expense', { description: err.message })
    },
  })
}

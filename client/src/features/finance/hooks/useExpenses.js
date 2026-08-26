import { useQuery } from '@tanstack/react-query'
import { expenseApi } from '../api/expenseApi'

export const expenseKeys = {
  all: ['expenses'],
  list: ['expenses', 'list'],
}

export function useExpenses() {
  return useQuery({
    queryKey: expenseKeys.list,
    queryFn: async () => {
      const { expenses } = await expenseApi.list()
      return expenses
    },
  })
}

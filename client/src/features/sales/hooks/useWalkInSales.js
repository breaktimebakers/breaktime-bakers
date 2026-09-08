import { useQuery } from '@tanstack/react-query'
import { walkInSaleApi } from '../api/walkInSaleApi'

export const walkInSaleKeys = {
  all: ['walkInSales'],
  list: ['walkInSales', 'list'],
}

export function useWalkInSales() {
  return useQuery({
    queryKey: walkInSaleKeys.list,
    queryFn: async () => {
      const { walkInSales } = await walkInSaleApi.list()
      return walkInSales
    },
  })
}

import { useQuery } from '@tanstack/react-query'
import { salesApi } from '../api/salesApi'

export const salesKeys = {
  overview: ['sales', 'overview'],
}

export function useSalesOverview() {
  return useQuery({
    queryKey: salesKeys.overview,
    queryFn: async () => {
      const { overview } = await salesApi.overview()
      return overview
    },
  })
}

import { useQuery } from '@tanstack/react-query'
import { registerApi } from '../api/registerApi'

export const adminKeys = {
  all: ['admins'],
  list: ['admins', 'list'],
}

export function useAdmins() {
  return useQuery({
    queryKey: adminKeys.list,
    queryFn: async () => {
      const { admins } = await registerApi.listAdmins()
      return admins
    },
  })
}

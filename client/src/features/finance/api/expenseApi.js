import { apiClient } from '@/lib/apiClient'
import { ENDPOINTS } from '@/constants/ENDPOINTS'

export const expenseApi = {
  list: () => apiClient.get(ENDPOINTS.expenses.list),
  create: (body) => apiClient.post(ENDPOINTS.expenses.create, body),
  remove: (id) => apiClient.delete(ENDPOINTS.expenses.remove(id)),
}

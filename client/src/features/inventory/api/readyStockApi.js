import { apiClient } from '@/lib/apiClient'
import { ENDPOINTS } from '@/constants/ENDPOINTS'

export const readyStockApi = {
  list: (query) => apiClient.get(ENDPOINTS.readyStock.list, { query }),
  history: (id, query) => apiClient.get(ENDPOINTS.readyStock.history(id), { query }),
}

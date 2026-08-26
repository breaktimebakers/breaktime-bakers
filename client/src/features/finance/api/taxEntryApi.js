import { apiClient } from '@/lib/apiClient'
import { ENDPOINTS } from '@/constants/ENDPOINTS'

export const taxEntryApi = {
  list: () => apiClient.get(ENDPOINTS.taxEntries.list),
  create: (body) => apiClient.post(ENDPOINTS.taxEntries.create, body),
  remove: (id) => apiClient.delete(ENDPOINTS.taxEntries.remove(id)),
}

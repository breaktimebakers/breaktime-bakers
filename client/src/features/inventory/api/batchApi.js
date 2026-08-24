import { apiClient } from '@/lib/apiClient'
import { ENDPOINTS } from '@/constants/ENDPOINTS'

export const batchApi = {
  list: (query) => apiClient.get(ENDPOINTS.batches.list, { query }),
  create: (body) => apiClient.post(ENDPOINTS.batches.create, body),
}

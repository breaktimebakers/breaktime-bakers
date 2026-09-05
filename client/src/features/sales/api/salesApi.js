import { apiClient } from '@/lib/apiClient'
import { ENDPOINTS } from '@/constants/ENDPOINTS'

export const salesApi = {
  overview: () => apiClient.get(ENDPOINTS.sales.overview),
}

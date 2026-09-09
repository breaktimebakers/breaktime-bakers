import { apiClient } from '@/lib/apiClient'
import { ENDPOINTS } from '@/constants/ENDPOINTS'

export const walkInSaleApi = {
  list: () => apiClient.get(ENDPOINTS.walkInSales.list),
  create: (body) => apiClient.post(ENDPOINTS.walkInSales.create, body),
  settle: (id) => apiClient.patch(ENDPOINTS.walkInSales.settle(id)),
  recordPayment: (id, amount) => apiClient.patch(ENDPOINTS.walkInSales.recordPayment(id), { amount }),
}

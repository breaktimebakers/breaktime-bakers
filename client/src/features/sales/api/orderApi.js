import { apiClient } from '@/lib/apiClient'
import { ENDPOINTS } from '@/constants/ENDPOINTS'

export const orderApi = {
  list: (query) => apiClient.get(ENDPOINTS.orders.list, { query }),
  create: (body) => apiClient.post(ENDPOINTS.orders.create, body),
  updateStatus: (id, status) => apiClient.patch(ENDPOINTS.orders.updateStatus(id), { status }),
  fulfill: (id, body) => apiClient.patch(ENDPOINTS.orders.fulfill(id), body),
  getOrderTakerStats: (orderTakerId, range) => apiClient.get(ENDPOINTS.orders.orderTakerStats, { query: { orderTakerId, range } }),
}

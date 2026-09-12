import { apiClient } from '@/lib/apiClient'
import { ENDPOINTS } from '@/constants/ENDPOINTS'

export const customerPaymentApi = {
  record: (body) => apiClient.post(ENDPOINTS.orderPayments.record, body),
  listForOrder: (orderId) => apiClient.get(ENDPOINTS.orderPayments.listForOrder, { query: { orderId } }),
  overview: () => apiClient.get(ENDPOINTS.orderPayments.overview),
  areas: () => apiClient.get(ENDPOINTS.orderPayments.areas),
  areaStores: (areaId, query) => apiClient.get(ENDPOINTS.orderPayments.areaStores(areaId), { query }),
  storeDetail: (storeId) => apiClient.get(ENDPOINTS.orderPayments.storeDetail(storeId)),
}

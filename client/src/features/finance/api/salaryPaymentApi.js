import { apiClient } from '@/lib/apiClient'
import { ENDPOINTS } from '@/constants/ENDPOINTS'

export const salaryPaymentApi = {
  list: () => apiClient.get(ENDPOINTS.salaryPayments.list),
  markPaid: (body) => apiClient.post(ENDPOINTS.salaryPayments.markPaid, body),
  bulkMarkPaid: (payments) => apiClient.post(ENDPOINTS.salaryPayments.bulkMarkPaid, { payments }),
  markUnpaid: (workerId, year, month) => apiClient.delete(ENDPOINTS.salaryPayments.markUnpaid(workerId, year, month)),
}

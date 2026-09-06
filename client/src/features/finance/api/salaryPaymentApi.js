import { apiClient } from '@/lib/apiClient'
import { ENDPOINTS } from '@/constants/ENDPOINTS'

export const salaryPaymentApi = {
  list: () => apiClient.get(ENDPOINTS.salaryPayments.list),
  payroll: (query) => apiClient.get(ENDPOINTS.salaryPayments.payroll, { query }),
  markPaid: (body) => apiClient.post(ENDPOINTS.salaryPayments.markPaid, body),
  bulkMarkPaid: (body) => apiClient.post(ENDPOINTS.salaryPayments.bulkMarkPaid, body),
  markUnpaid: (workerId, year, month) => apiClient.delete(ENDPOINTS.salaryPayments.markUnpaid(workerId, year, month)),
}

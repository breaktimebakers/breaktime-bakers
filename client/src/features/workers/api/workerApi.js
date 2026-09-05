import { apiClient } from '@/lib/apiClient'
import { ENDPOINTS } from '@/constants/ENDPOINTS'

export const workerApi = {
  list: () => apiClient.get(ENDPOINTS.workers.list),
  detail: (id) => apiClient.get(ENDPOINTS.workers.detail(id)),
  create: (body) => apiClient.post(ENDPOINTS.workers.create, body),
  update: (id, body) => apiClient.patch(ENDPOINTS.workers.update(id), body),
  remove: (id) => apiClient.delete(ENDPOINTS.workers.remove(id)),
  markLeft: (id) => apiClient.patch(ENDPOINTS.workers.leave(id)),
  reactivate: (id) => apiClient.patch(ENDPOINTS.workers.reactivate(id)),
}

export const attendanceApi = {
  listByDate: (date) => apiClient.get(ENDPOINTS.attendance.list, { query: { date } }),
  listByWorker: (workerId) => apiClient.get(ENDPOINTS.attendance.list, { query: { workerId } }),
  listAll: () => apiClient.get(ENDPOINTS.attendance.list),
  mark: (body) => apiClient.post(ENDPOINTS.attendance.mark, body),
  clear: (workerId, date) => apiClient.delete(ENDPOINTS.attendance.clear(workerId, date)),
}

export const advanceApi = {
  listByWorker: (workerId) => apiClient.get(ENDPOINTS.advances.list, { query: { workerId } }),
  listAll: () => apiClient.get(ENDPOINTS.advances.list),
  create: (body) => apiClient.post(ENDPOINTS.advances.create, body),
  remove: (id) => apiClient.delete(ENDPOINTS.advances.remove(id)),
}

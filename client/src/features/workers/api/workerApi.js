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
  updateAreas: (id, areaIds) => apiClient.patch(ENDPOINTS.workers.updateAreas(id), { areaIds }),
}

export const attendanceApi = {
  listByDate: (date) => apiClient.get(ENDPOINTS.attendance.list, { query: { date } }),
  listByWorker: (workerId) => apiClient.get(ENDPOINTS.attendance.list, { query: { workerId } }),
  listAll: () => apiClient.get(ENDPOINTS.attendance.list),
  mark: (body) => apiClient.post(ENDPOINTS.attendance.mark, body),
  clear: (workerId, date) => apiClient.delete(ENDPOINTS.attendance.clear(workerId, date)),
}

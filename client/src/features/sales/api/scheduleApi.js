import { apiClient } from '@/lib/apiClient'
import { ENDPOINTS } from '@/constants/ENDPOINTS'

export const scheduleApi = {
  getDay: (date) => apiClient.get(ENDPOINTS.schedule.day, { query: date ? { date } : undefined }),
  getToday: () => apiClient.get(ENDPOINTS.schedule.today),
  setAssignment: (workerId, date, areaId) => apiClient.put(ENDPOINTS.schedule.assignment(workerId), { date, areaId }),
}

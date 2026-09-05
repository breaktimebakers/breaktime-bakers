import { apiClient } from '@/lib/apiClient'
import { ENDPOINTS } from '@/constants/ENDPOINTS'

export const scheduleApi = {
  getWeek: (weekStart) => apiClient.get(ENDPOINTS.schedule.week, { query: weekStart ? { weekStart } : undefined }),
  getToday: () => apiClient.get(ENDPOINTS.schedule.today),
  saveTemplate: (workerId, days) => apiClient.put(ENDPOINTS.schedule.template(workerId), { days }),
  setOverride: (workerId, date, areaId) => apiClient.patch(ENDPOINTS.schedule.override(workerId), { date, areaId }),
}

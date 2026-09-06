import { apiClient } from '@/lib/apiClient'
import { ENDPOINTS } from '@/constants/ENDPOINTS'

export const deliveryApi = {
  getStatus: (query) => apiClient.get(ENDPOINTS.delivery.status, { query }),
  getScheduleDay: (date) => apiClient.get(ENDPOINTS.delivery.scheduleDay, { query: date ? { date } : undefined }),
  getScheduleToday: () => apiClient.get(ENDPOINTS.delivery.scheduleToday),
  setDriverAreas: (driverId, date, areaIds) => apiClient.put(ENDPOINTS.delivery.setAreas(driverId), { date, areaIds }),
  getDriverDay: (driverId, date) => apiClient.get(ENDPOINTS.delivery.driverDay(driverId), { query: date ? { date } : undefined }),
  getDriverStats: (driverId, range) => apiClient.get(ENDPOINTS.delivery.driverStats(driverId), { query: { range } }),
}

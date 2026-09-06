import { useQuery } from '@tanstack/react-query'
import { deliveryApi } from '../api/deliveryApi'

export const deliveryKeys = {
  all: ['delivery'],
  scheduleDay: (date) => ['delivery', 'schedule', date || 'today'],
  scheduleToday: ['delivery', 'schedule', 'today'],
  driverDay: (driverId, date) => ['delivery', 'drivers', driverId, 'day', date || 'today'],
  driverStats: (driverId, range) => ['delivery', 'drivers', driverId, 'stats', range],
}

export function useDeliveryScheduleDay(date) {
  return useQuery({
    queryKey: deliveryKeys.scheduleDay(date),
    queryFn: () => deliveryApi.getScheduleDay(date),
  })
}

export function useDeliveryScheduleToday() {
  return useQuery({
    queryKey: deliveryKeys.scheduleToday,
    queryFn: () => deliveryApi.getScheduleToday(),
  })
}

export function useDriverDay(driverId, date) {
  return useQuery({
    queryKey: deliveryKeys.driverDay(driverId, date),
    queryFn: () => deliveryApi.getDriverDay(driverId, date),
    enabled: !!driverId,
  })
}

// Only 7 or 30 - matches the order-taker detail page's chart toggle.
export function useDriverStats(driverId, range = 7) {
  return useQuery({
    queryKey: deliveryKeys.driverStats(driverId, range),
    queryFn: () => deliveryApi.getDriverStats(driverId, range),
    enabled: !!driverId,
  })
}

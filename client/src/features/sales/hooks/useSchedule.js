import { useQuery } from '@tanstack/react-query'
import { scheduleApi } from '../api/scheduleApi'

export const scheduleKeys = {
  all: ['schedule'],
  week: (weekStart) => ['schedule', 'week', weekStart || 'current'],
  today: ['schedule', 'today'],
}

// The full Sun-Sat grid for one week (defaults server-side to the
// current week) - what the weekly schedule page reads/edits.
export function useScheduleWeek(weekStart) {
  return useQuery({
    queryKey: scheduleKeys.week(weekStart),
    queryFn: () => scheduleApi.getWeek(weekStart),
  })
}

// Every marketer's effective area for today only - a lighter read than
// the full week, used by the order-taker list badge and the Add Order
// modals to filter valid store/order-taker pairings.
export function useScheduleToday() {
  return useQuery({
    queryKey: scheduleKeys.today,
    queryFn: () => scheduleApi.getToday(),
  })
}

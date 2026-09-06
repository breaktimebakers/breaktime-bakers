import { useQuery } from '@tanstack/react-query'
import { scheduleApi } from '../api/scheduleApi'

export const scheduleKeys = {
  all: ['schedule'],
  day: (date) => ['schedule', 'day', date || 'today'],
  today: ['schedule', 'today'],
}

export function useScheduleDay(date) {
  return useQuery({
    queryKey: scheduleKeys.day(date),
    queryFn: () => scheduleApi.getDay(date),
  })
}

export function useScheduleToday() {
  return useQuery({
    queryKey: scheduleKeys.today,
    queryFn: () => scheduleApi.getToday(),
  })
}

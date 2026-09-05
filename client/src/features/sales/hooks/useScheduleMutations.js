import { useMutation, useQueryClient } from '@tanstack/react-query'
import { scheduleApi } from '../api/scheduleApi'
import { scheduleKeys } from './useSchedule'
import { toast } from '@/lib/toast'

const invalidateSchedule = (queryClient) => queryClient.invalidateQueries({ queryKey: scheduleKeys.all })

export function useSaveWeeklyTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ workerId, days }) => scheduleApi.saveTemplate(workerId, days),
    onSuccess: () => {
      invalidateSchedule(queryClient)
      toast.success('Weekly schedule saved')
    },
    onError: (err) => {
      toast.error('Could not save weekly schedule', { description: err.message })
    },
  })
}

export function useSetScheduleOverride() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ workerId, date, areaId }) => scheduleApi.setOverride(workerId, date, areaId),
    onSuccess: () => {
      invalidateSchedule(queryClient)
      toast.success('Schedule updated')
    },
    onError: (err) => {
      toast.error('Could not update schedule', { description: err.message })
    },
  })
}

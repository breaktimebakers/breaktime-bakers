import { useMutation, useQueryClient } from '@tanstack/react-query'
import { scheduleApi } from '../api/scheduleApi'
import { scheduleKeys } from './useSchedule'
import { toast } from '@/lib/toast'

export function useSetDailyAssignment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ workerId, date, areaId }) => scheduleApi.setAssignment(workerId, date, areaId),
    onSuccess: async (_data, { areaId }) => {
      await queryClient.invalidateQueries({ queryKey: scheduleKeys.all })
      toast.success(areaId ? 'Area assigned' : 'Assignment cleared')
    },
    onError: (err) => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all })
      toast.error('Could not save assignment', { description: err.message })
    },
  })
}

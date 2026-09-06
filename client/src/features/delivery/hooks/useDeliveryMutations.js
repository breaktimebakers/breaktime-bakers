import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deliveryApi } from '../api/deliveryApi'
import { deliveryKeys } from './useDeliverySchedule'
import { toast } from '@/lib/toast'

export function useSetDriverAreas() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ driverId, date, areaIds }) => deliveryApi.setDriverAreas(driverId, date, areaIds),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: deliveryKeys.all })
      toast.success('Areas saved')
    },
    onError: (err) => {
      queryClient.invalidateQueries({ queryKey: deliveryKeys.all })
      toast.error('Could not save areas', { description: err.message })
    },
  })
}

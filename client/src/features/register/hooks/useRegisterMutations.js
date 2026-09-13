import { useMutation } from '@tanstack/react-query'
import { registerApi } from '../api/registerApi'
import { toast } from '@/lib/toast'

export function useCreateAdmin() {
  return useMutation({
    mutationFn: registerApi.createAdmin,
    onSuccess: () => {
      toast.success('Admin created')
    },
    onError: (err) => {
      toast.error('Could not create admin', { description: err.message })
    },
  })
}

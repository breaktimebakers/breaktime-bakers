import { useMutation, useQueryClient } from '@tanstack/react-query'
import { registerApi } from '../api/registerApi'
import { adminKeys } from './useAdmins'
import { toast } from '@/lib/toast'

const invalidateAdmins = (queryClient) => queryClient.invalidateQueries({ queryKey: adminKeys.all })

export function useCreateAdmin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: registerApi.createAdmin,
    onSuccess: () => {
      invalidateAdmins(queryClient)
      toast.success('Admin created')
    },
    onError: (err) => {
      toast.error('Could not create admin', { description: err.message })
    },
  })
}

export function useDeleteAdmin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => registerApi.deleteAdmin(id),
    onSuccess: () => {
      invalidateAdmins(queryClient)
      toast.success('Admin deleted')
    },
    onError: (err) => {
      toast.error('Could not delete admin', { description: err.message })
    },
  })
}

export function useChangeAdminPassword() {
  return useMutation({
    mutationFn: ({ id, password }) => registerApi.changeAdminPassword(id, password),
    onSuccess: () => {
      toast.success('Password updated')
    },
    onError: (err) => {
      toast.error('Could not update password', { description: err.message })
    },
  })
}

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { workerApi, attendanceApi } from '../api/workerApi'
import { workerKeys, attendanceKeys } from './useWorkers'
import { toast } from '@/lib/toast'

const invalidateWorkers = (queryClient) => queryClient.invalidateQueries({ queryKey: workerKeys.all })

// Attendance invalidation is broader than "just this worker" or "just
// today" because marking one entry can affect both a by-date view
// (Attendance overview) and a by-worker view (Worker detail) at once.
const invalidateAttendance = (queryClient) => queryClient.invalidateQueries({ queryKey: attendanceKeys.all })

export function useCreateWorker() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: workerApi.create,
    onSuccess: () => {
      invalidateWorkers(queryClient)
      toast.success('Worker added')
    },
    onError: (err) => {
      toast.error('Could not add worker', { description: err.message })
    },
  })
}

export function useUpdateWorker() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }) => workerApi.update(id, body),
    onSuccess: () => {
      invalidateWorkers(queryClient)
      toast.success('Worker updated')
    },
    onError: (err) => {
      toast.error('Could not update worker', { description: err.message })
    },
  })
}

export function useDeleteWorker() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => workerApi.remove(id),
    onSuccess: () => {
      invalidateWorkers(queryClient)
      toast.success('Worker deleted')
    },
    onError: (err) => {
      toast.error('Could not delete worker', { description: err.message })
    },
  })
}

export function useMarkWorkerLeft() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => workerApi.markLeft(id),
    onSuccess: () => {
      invalidateWorkers(queryClient)
      toast.success('Worker marked as left')
    },
    onError: (err) => {
      toast.error('Could not update worker', { description: err.message })
    },
  })
}

export function useReactivateWorker() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => workerApi.reactivate(id),
    onSuccess: () => {
      invalidateWorkers(queryClient)
      toast.success('Worker reactivated')
    },
    onError: (err) => {
      toast.error('Could not update worker', { description: err.message })
    },
  })
}

export function useUpdateWorkerAreas() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, areaIds }) => workerApi.updateAreas(id, areaIds),
    onSuccess: () => {
      invalidateWorkers(queryClient)
      toast.success('Assigned areas updated')
    },
    onError: (err) => {
      toast.error('Could not update assigned areas', { description: err.message })
    },
  })
}

export function useMarkAttendance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: attendanceApi.mark,
    onSuccess: () => invalidateAttendance(queryClient),
    onError: (err) => {
      toast.error('Could not save attendance', { description: err.message })
    },
  })
}

export function useClearAttendance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ workerId, date }) => attendanceApi.clear(workerId, date),
    onSuccess: () => invalidateAttendance(queryClient),
    onError: (err) => {
      toast.error('Could not clear attendance', { description: err.message })
    },
  })
}

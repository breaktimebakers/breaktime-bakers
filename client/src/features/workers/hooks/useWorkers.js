import { useQuery } from '@tanstack/react-query'
import { workerApi, attendanceApi } from '../api/workerApi'

export const workerKeys = {
  all: ['workers'],
  list: ['workers', 'list'],
  detail: (id) => ['workers', id],
}

export const attendanceKeys = {
  all: ['attendance'],
  allList: ['attendance', 'all'],
  byDate: (date) => ['attendance', 'date', date],
  byWorker: (workerId) => ['attendance', 'worker', workerId],
}

export function useWorkers() {
  return useQuery({
    queryKey: workerKeys.list,
    queryFn: async () => {
      const { workers } = await workerApi.list()
      return workers
    },
  })
}

export function useWorker(id) {
  return useQuery({
    queryKey: workerKeys.detail(id),
    queryFn: async () => {
      const { worker } = await workerApi.detail(id)
      return worker
    },
    enabled: !!id,
  })
}

// Every worker's status for one calendar day - what the Attendance
// overview page marks against.
export function useAttendanceByDate(date) {
  return useQuery({
    queryKey: attendanceKeys.byDate(date),
    queryFn: async () => {
      const { attendance } = await attendanceApi.listByDate(date)
      return attendance
    },
    enabled: !!date,
  })
}

// One worker's full history - what the worker detail page's calendar and
// list view read.
export function useWorkerAttendance(workerId) {
  return useQuery({
    queryKey: attendanceKeys.byWorker(workerId),
    queryFn: async () => {
      const { attendance } = await attendanceApi.listByWorker(workerId)
      return attendance
    },
    enabled: !!workerId,
  })
}

// Every entry, across every worker and date - what Finance's salary
// aggregation reads (getSalaryForMonth/getProfitAndLoss take an arbitrary
// (year, month) per call, including several at once for a trend chart, so
// there's no single date/worker to scope a query to).
export function useAllAttendance() {
  return useQuery({
    queryKey: attendanceKeys.allList,
    queryFn: async () => {
      const { attendance } = await attendanceApi.listAll()
      return attendance
    },
  })
}

import { useQuery } from '@tanstack/react-query'
import { advanceApi } from '../api/workerApi'

export const advanceKeys = {
  all: ['advances'],
  allList: ['advances', 'all'],
  byWorker: (workerId) => ['advances', 'worker', workerId],
}

// One worker's advance ledger - what the worker detail page's Advances
// list and cap check read.
export function useWorkerAdvances(workerId) {
  return useQuery({
    queryKey: advanceKeys.byWorker(workerId),
    queryFn: async () => {
      const { advances } = await advanceApi.listByWorker(workerId)
      return advances
    },
    enabled: !!workerId,
  })
}

// Every advance, across every worker - what Finance's net-payable and
// Paid/Unpaid totals read (same unscoped-list precedent as
// useAllAttendance).
export function useAllAdvances() {
  return useQuery({
    queryKey: advanceKeys.allList,
    queryFn: async () => {
      const { advances } = await advanceApi.listAll()
      return advances
    },
  })
}

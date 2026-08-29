import { useQuery } from '@tanstack/react-query'
import { salaryPaymentApi } from '../api/salaryPaymentApi'

export const salaryPaymentKeys = {
  all: ['salaryPayments'],
  list: ['salaryPayments', 'list'],
}

// Every settlement record, across every worker and month - what the
// Finance Salary page's per-row Paid/Not Paid status and running
// Paid/Unpaid totals read (same unscoped-list precedent as
// useAllAttendance/useAllAdvances).
export function useSalaryPayments() {
  return useQuery({
    queryKey: salaryPaymentKeys.list,
    queryFn: async () => {
      const { payments } = await salaryPaymentApi.list()
      return payments
    },
  })
}

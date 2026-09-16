import { useWorkers, useAllAttendance, useAllAdvances } from '@/features/workers/hooks'
import { computeGrossSalaryForMonth, sumAdvancesForMonth } from '@/features/workers/utils'
import { useSalaryPayments } from './useSalaryPayments'
import { useMarkSalaryPaid, useMarkSalaryUnpaid, useBulkMarkSalaryPaid } from './useSalaryPaymentMutations'
import { useExpenses } from './useExpenses'
import { useTaxEntries } from './useTaxEntries'
import { todayISO } from '@/utils'

export function useFinance() {
  // Supplier Payments reads real lots directly via useAllLots/
  // useUpdateLotPayment (see SupplierPayments.jsx) - a dedicated
  // GET /raw-materials/lots endpoint scoped to a date range. P&L itself
  // now lives in useProfitAndLoss.js (useProfitAndLoss /
  // useProfitAndLossTrend), which wires up the same raw-material-lots,
  // batch-consumption, and customer-payment-period endpoints - kept
  // separate from this hook since those need their own per-month/
  // multi-month query plumbing rather than the plain-object shape below.
  // outstandingSupplier stays pinned at 0 here - it needs an unscoped
  // (all lots, any month) fetch, a separate gap from P&L's.
  const { data: workers = [] } = useWorkers()
  // getSalaryForMonth below takes an arbitrary (year, month) per call, so
  // there's no single date to scope a fetch to. useAllAttendance fetches
  // the whole table once (same unscoped-list precedent as useWorkers/
  // useAreas at this app's scale) and the month filtering below happens
  // client-side, same as the original mock data did.
  const { data: attendance = [] } = useAllAttendance()
  const { data: advances = [] } = useAllAdvances()
  const { data: salaryPayments = [] } = useSalaryPayments()
  const { data: expenses = [] } = useExpenses()
  const { data: taxEntries = [] } = useTaxEntries()

  const markSalaryPaidMutation = useMarkSalaryPaid()
  const markSalaryUnpaidMutation = useMarkSalaryUnpaid()
  const bulkMarkSalaryPaidMutation = useBulkMarkSalaryPaid()

  // Get salary for a worker for a given month, using attendance + dailySalaryFromMonthly
  const getSalaryForMonth = (workerId, year, month) => {
    const worker = workers.find((w) => w.id === workerId)
    if (!worker) return { total: 0, present: 0, half: 0, absent: 0, overtime: 0, dailySalary: 0, otRate: 0 }
    return computeGrossSalaryForMonth(worker, attendance.filter((a) => a.workerId === workerId), year, month)
  }

  // Advances given to a worker within one month - deducted from that
  // month's gross to get what's actually still owed.
  const getAdvancesForMonth = (workerId, year, month) => sumAdvancesForMonth(advances, workerId, year, month)

  const getNetPayable = (workerId, year, month) =>
    getSalaryForMonth(workerId, year, month).total - getAdvancesForMonth(workerId, year, month)

  const isSalaryPaid = (workerId, year, month) =>
    salaryPayments.some((p) => p.workerId === workerId && p.year === year && p.month === month)

  const markSalaryPaid = (workerId, year, month) => {
    markSalaryPaidMutation.mutate({ workerId, year, month })
  }

  const markSalaryUnpaid = (workerId, year, month) => {
    markSalaryUnpaidMutation.mutate({ workerId, year, month })
  }

  const bulkMarkSalaryPaid = (workerIds, year, month) => {
    bulkMarkSalaryPaidMutation.mutate({ workerIds, year, month })
  }

  // Every (year, month) from a worker's joining month through now (or
  // through their leftDate's month if they've left) - what the running
  // Paid/Unpaid totals below walk for every worker to decide which
  // months' net payable still counts as owed.
  const monthsSinceJoining = (worker, nowYear, nowMonth) => {
    // joiningDate/leftDate are "YYYY-MM-DD" strings - parsed directly
    // rather than via `new Date(str)`, which the JS spec parses as UTC
    // midnight; calling the local `.getFullYear()`/`.getMonth()` on that
    // afterwards can silently shift the joining month back by a day (and
    // therefore a whole month, right at a month boundary) for anyone not
    // in a UTC+0 timezone.
    const [startY, startM] = worker.joiningDate.split('-').map(Number)
    let y = startY
    let m = startM - 1
    let endY = nowYear
    let endM = nowMonth
    if (worker.status === 'left' && worker.leftDate) {
      const [leftY, leftM] = worker.leftDate.split('-').map(Number)
      endY = leftY
      endM = leftM - 1
    }
    const months = []
    while (y < endY || (y === endY && m <= endM)) {
      months.push({ year: y, month: m })
      m += 1
      if (m > 11) {
        m = 0
        y += 1
      }
    }
    return months
  }

  // Money that actually went out the door for one specific month - every
  // advance given that month (spent the moment it's given, regardless of
  // whether that month's salary is marked paid yet) plus the net payable
  // for that month if it's been marked paid. Scoped to whichever month
  // the Finance Salary page's filter is on, so it changes as you flip
  // months - this is a period figure ("what did we pay in August"), not
  // a running lifetime total.
  const getPaidTotalForMonth = (year, month) => {
    const advancesTotal = workers.reduce((s, w) => s + getAdvancesForMonth(w.id, year, month), 0)
    const paidNet = salaryPayments
      .filter((payment) => payment.year === year && payment.month === month)
      .reduce((sum, payment) => sum + Number(payment.amountPaid), 0)
    return advancesTotal + paidNet
  }

  // Running total of net payable still owed, across every worker and
  // every month from their joining date through now that hasn't been
  // marked paid - unlike getPaidTotalForMonth above, this is deliberately
  // NOT scoped to the filtered month. It's the real outstanding
  // liability regardless of which month it originated in, so an unpaid
  // month keeps counting here every time this is called in a later
  // month - that's the entire "rollover" behavior, no separate
  // carry-forward step needed.
  const getUnpaidTotal = () => {
    const [nowYear, nowMonthOneIndexed] = todayISO().split('-').map(Number)
    const nowMonth = nowMonthOneIndexed - 1
    let unpaid = 0
    workers.forEach((w) => {
      monthsSinceJoining(w, nowYear, nowMonth).forEach(({ year, month }) => {
        if (!isSalaryPaid(w.id, year, month)) unpaid += getNetPayable(w.id, year, month)
      })
    })
    return unpaid
  }

  // Supplier outstanding is pinned at 0 - this needs an unscoped (all
  // lots, any month) fetch, not yet wired to the new per-month useAllLots
  // endpoint. Customer outstanding is real now - see
  // useCustomerPaymentsOverview in useCustomerPayments.js, called directly
  // by whichever page needs it (FinanceOverview.jsx) rather than threaded
  // through this hook.
  const outstandingSupplier = 0

  return {
    expenses, taxEntries,
    getSalaryForMonth,
    getAdvancesForMonth,
    getNetPayable,
    isSalaryPaid,
    markSalaryPaid,
    markSalaryUnpaid,
    bulkMarkSalaryPaid,
    getPaidTotalForMonth,
    getUnpaidTotal,
    outstandingSupplier,
  }
}

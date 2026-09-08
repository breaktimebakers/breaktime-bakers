import { useQueryClient } from '@tanstack/react-query'
import { useLocalQuery, setLocalData } from '@/lib/localStore'
import { useWorkers, useAllAttendance, useAllAdvances } from '@/features/workers/hooks'
import { computeGrossSalaryForMonth, sumAdvancesForMonth } from '@/features/workers/utils'
import { useSalaryPayments } from './useSalaryPayments'
import { useMarkSalaryPaid, useMarkSalaryUnpaid, useBulkMarkSalaryPaid } from './useSalaryPaymentMutations'
import { useExpenses } from './useExpenses'
import { useTaxEntries } from './useTaxEntries'
import { seedCustomerPayments } from '../data/seedFinance'
import { todayISO } from '@/utils'

const KEYS = {
  customerPayments: ['local', 'finance', 'customerPayments'],
}

export function useFinance() {
  const queryClient = useQueryClient()
  // Supplier Payments now reads real lots directly via useAllLots/
  // useUpdateLotPayment (see SupplierPayments.jsx) - a dedicated
  // GET /raw-materials/lots endpoint scoped to a date range. outstandingSupplier
  // and the P&L "raw materials purchased/used" lines below are still
  // pinned at 0 - they need a multi-month view (6 months at once for the
  // trend chart) that hasn't been wired to the new endpoint yet, a real
  // feature to build, not a safe thing to improvise as a side effect of
  // something else.
  const { data: workers = [] } = useWorkers()
  // getSalaryForMonth/getProfitAndLoss below take an arbitrary (year,
  // month) per call - FinanceOverview's trend chart calls getProfitAndLoss
  // for 6 different months in one render - so there's no single date to
  // scope a fetch to. useAllAttendance fetches the whole table once
  // (same unscoped-list precedent as useWorkers/useAreas at this app's
  // scale) and the month filtering below happens client-side, same as
  // the original mock data did.
  const { data: attendance = [] } = useAllAttendance()
  const { data: advances = [] } = useAllAdvances()
  const { data: salaryPayments = [] } = useSalaryPayments()
  const { data: expenses = [] } = useExpenses()
  const { data: taxEntries = [] } = useTaxEntries()

  const markSalaryPaidMutation = useMarkSalaryPaid()
  const markSalaryUnpaidMutation = useMarkSalaryUnpaid()
  const bulkMarkSalaryPaidMutation = useBulkMarkSalaryPaid()

  const { data: customerPayments = [] } = useLocalQuery(KEYS.customerPayments, seedCustomerPayments)

  const addCustomerPayment = (data) => {
    const id = 'cp' + Date.now()
    setLocalData(queryClient, KEYS.customerPayments, (p) => [{ id, buyerName: data.buyerName, buyerType: data.buyerType || 'store', storeId: data.storeId || null, areaId: data.areaId || null, amount: Number(data.amount) || 0, amountPaid: 0, paymentHistory: [], date: data.date, status: 'outstanding', paidDate: null }, ...p])
  }

  const addPartialPayment = (id, partialAmount) => {
    setLocalData(queryClient, KEYS.customerPayments, (p) => p.map((c) => {
      if (c.id !== id) return c
      const newAmountPaid = (c.amountPaid || 0) + Number(partialAmount)
      const isFullyPaid = newAmountPaid >= c.amount
      const todayStr = todayISO()
      return {
        ...c,
        amountPaid: isFullyPaid ? c.amount : newAmountPaid,
        paymentHistory: [...(c.paymentHistory || []), { amount: Number(partialAmount), date: todayStr }],
        status: isFullyPaid ? 'paid' : 'outstanding',
        paidDate: isFullyPaid ? todayStr : c.paidDate,
      }
    }))
  }

  const markCustomerPaymentPaid = (id) => {
    const todayStr = todayISO()
    setLocalData(queryClient, KEYS.customerPayments, (p) => p.map((c) => {
      if (c.id !== id) return c
      const remaining = c.amount - (c.amountPaid || 0)
      return {
        ...c,
        amountPaid: c.amount,
        paymentHistory: remaining > 0 ? [...(c.paymentHistory || []), { amount: remaining, date: todayStr }] : (c.paymentHistory || []),
        status: 'paid',
        paidDate: todayStr,
      }
    }))
  }

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

  // Sum of lot originalQty × unitCost for lots purchased in that month.
  // Supplier Payments itself now reads real per-month lots via useAllLots
  // (a single month at a time, driven by that page's own filter) - this
  // still needs the same data across an arbitrary (year, month), 6 months
  // at once for FinanceOverview's trend chart, which useAllLots' single
  // useQuery call per render can't do without a bigger refactor (see
  // rawMaterials comment above). Pinned at 0 until that's wired.
  // eslint-disable-next-line no-unused-vars
  const getRawMaterialPurchasedTotal = (year, month) => 0

  // Sum of ingredient cost consumed by batches in that month. Batches are
  // real now (see useBatches in the inventory feature), but wiring an
  // arbitrary (year, month) of them into this month-by-month P&L view is
  // a real feature to build, not a safe thing to improvise as a side
  // effect of something else - same reasoning as the rawMaterials.lots
  // gap above. Pinned at 0 until Finance itself gets wired.
  // eslint-disable-next-line no-unused-vars
  const getRawMaterialUsedTotal = (year, month) => 0

  // Profit & Loss for a month
  const getProfitAndLoss = (year, month) => {
    const mStr = `${year}-${String(month + 1).padStart(2, '0')}`
    // Sales = sum of customerPayments amounts for that month (regardless of paid/outstanding)
    const sales = customerPayments
      .filter((c) => c.date.startsWith(mStr))
      .reduce((s, c) => s + c.amount, 0)
    const rawMaterialsPurchased = getRawMaterialPurchasedTotal(year, month)
    const rawMaterialsUsed = getRawMaterialUsedTotal(year, month)
    // Salaries = sum of getSalaryForMonth for all workers
    const salaries = workers.reduce((s, w) => s + getSalaryForMonth(w.id, year, month).total, 0)
    const expensesTotal = expenses
      .filter((e) => e.date.startsWith(mStr))
      .reduce((s, e) => s + e.amount, 0)
    const taxes = taxEntries
      .filter((t) => t.date.startsWith(mStr))
      .reduce((s, t) => s + t.amount, 0)
    const profit = sales - rawMaterialsPurchased - salaries - expensesTotal - taxes
    return { sales, rawMaterialsPurchased, rawMaterialsUsed, salaries, expenses: expensesTotal, taxes, profit }
  }

  // Outstanding totals (supplier + customer). Supplier is pinned at 0 for
  // the same reason as getRawMaterialPurchasedTotal above - this needs an
  // unscoped (all lots, any month) fetch, not yet wired to the new
  // per-month useAllLots endpoint.
  const outstandingSupplier = 0

  const outstandingCustomer = customerPayments
    .filter((c) => c.status === 'outstanding')
    .reduce((s, c) => s + (c.amount - (c.amountPaid || 0)), 0)

  // Area-level payment summary
  const getAreaPaymentSummary = (areaId) => {
    const areaPayments = customerPayments.filter((c) => c.areaId === areaId)
    const outstanding = areaPayments
      .filter((c) => c.status === 'outstanding')
      .reduce((s, c) => s + (c.amount - (c.amountPaid || 0)), 0)
    const paid = areaPayments
      .filter((c) => c.status === 'paid')
      .reduce((s, c) => s + c.amount, 0)
    const storeIds = new Set(areaPayments.filter((c) => c.storeId).map((c) => c.storeId))
    return { outstanding, paid, storeCount: storeIds.size }
  }

  // Store-level payment summary with entries
  const getStorePaymentSummary = (storeId) => {
    const storePayments = customerPayments.filter((c) => c.storeId === storeId)
    const outstanding = storePayments
      .filter((c) => c.status === 'outstanding')
      .reduce((s, c) => s + (c.amount - (c.amountPaid || 0)), 0)
    const paid = storePayments
      .filter((c) => c.status === 'paid')
      .reduce((s, c) => s + c.amount, 0)
    const totalBilled = storePayments.reduce((s, c) => s + c.amount, 0)
    return { outstanding, paid, totalBilled, entries: storePayments }
  }

  return {
    expenses, customerPayments, taxEntries,
    addCustomerPayment, addPartialPayment, markCustomerPaymentPaid,
    getSalaryForMonth,
    getAdvancesForMonth,
    getNetPayable,
    isSalaryPaid,
    markSalaryPaid,
    markSalaryUnpaid,
    bulkMarkSalaryPaid,
    getPaidTotalForMonth,
    getUnpaidTotal,
    getRawMaterialPurchasedTotal,
    getRawMaterialUsedTotal,
    getProfitAndLoss,
    outstandingSupplier,
    outstandingCustomer,
    getAreaPaymentSummary,
    getStorePaymentSummary,
  }
}

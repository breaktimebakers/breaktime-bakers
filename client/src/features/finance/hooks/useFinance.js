import { useQueryClient } from '@tanstack/react-query'
import { useLocalQuery, setLocalData } from '@/lib/localStore'
import { useRawMaterials } from '@/features/inventory/hooks'
import { useWorkers, useAllAttendance, useAllAdvances } from '@/features/workers/hooks'
import { computeGrossSalaryForMonth, sumAdvancesForMonth } from '@/features/workers/utils'
import { useSalaryPayments } from './useSalaryPayments'
import { useMarkSalaryPaid, useMarkSalaryUnpaid, useBulkMarkSalaryPaid } from './useSalaryPaymentMutations'
import { useExpenses } from './useExpenses'
import { useTaxEntries } from './useTaxEntries'
import { seedCustomerPayments, seedSupplierPaymentStatus } from '../data/seedFinance'

const KEYS = {
  customerPayments: ['local', 'finance', 'customerPayments'],
  supplierPaymentStatus: ['local', 'finance', 'supplierPaymentStatus'],
}

export function useFinance() {
  const queryClient = useQueryClient()
  // Raw materials come from the real backend (see useRawMaterials), which
  // - unlike the old mock data - does NOT embed each material's lots in
  // the list response (lots are a separate per-material fetch). Every
  // read of `rm.lots` below is guarded to fall back to [] rather than
  // crash. That makes supplier-payment rows, per-material purchase
  // history, and the "raw materials used" P&L line read as empty/zero
  // for now instead of reflecting real data - fetching lots across every
  // material for an arbitrary (year, month) needs either a dedicated
  // backend endpoint or a fetch keyed to whatever month the Finance UI
  // has selected, which is a real feature to build, not a safe thing to
  // improvise as a side effect of something else.
  const { data: rawMaterials = [] } = useRawMaterials()
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
  const { data: supplierPaymentStatus = {} } = useLocalQuery(KEYS.supplierPaymentStatus, seedSupplierPaymentStatus)

  const addCustomerPayment = (data) => {
    const id = 'cp' + Date.now()
    setLocalData(queryClient, KEYS.customerPayments, (p) => [{ id, buyerName: data.buyerName, buyerType: data.buyerType || 'store', storeId: data.storeId || null, areaId: data.areaId || null, amount: Number(data.amount) || 0, amountPaid: 0, paymentHistory: [], date: data.date, status: 'outstanding', paidDate: null }, ...p])
  }

  const addPartialPayment = (id, partialAmount) => {
    setLocalData(queryClient, KEYS.customerPayments, (p) => p.map((c) => {
      if (c.id !== id) return c
      const newAmountPaid = (c.amountPaid || 0) + Number(partialAmount)
      const isFullyPaid = newAmountPaid >= c.amount
      const todayStr = new Date().toISOString().slice(0, 10)
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
    const todayStr = new Date().toISOString().slice(0, 10)
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

  const markLotPaid = (lotId) => {
    setLocalData(queryClient, KEYS.supplierPaymentStatus, (p) => ({ ...p, [lotId]: { status: 'paid', paidDate: new Date().toISOString().slice(0, 10) } }))
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
    markSalaryPaidMutation.mutate({ workerId, year, month, amountPaid: getNetPayable(workerId, year, month) })
  }

  const markSalaryUnpaid = (workerId, year, month) => {
    markSalaryUnpaidMutation.mutate({ workerId, year, month })
  }

  const bulkMarkSalaryPaid = (workerIds, year, month) => {
    const payments = workerIds.map((workerId) => ({
      workerId,
      year,
      month,
      amountPaid: getNetPayable(workerId, year, month),
    }))
    bulkMarkSalaryPaidMutation.mutate(payments)
  }

  // Every (year, month) from a worker's joining month through now (or
  // through their leftDate's month if they've left) - what the running
  // Paid/Unpaid totals below walk for every worker to decide which
  // months' net payable still counts as owed.
  const monthsSinceJoining = (worker, nowYear, nowMonth) => {
    const start = new Date(worker.joiningDate)
    let y = start.getFullYear()
    let m = start.getMonth()
    let endY = nowYear
    let endM = nowMonth
    if (worker.status === 'left' && worker.leftDate) {
      const left = new Date(worker.leftDate)
      endY = left.getFullYear()
      endM = left.getMonth()
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
    const paidNet = workers.reduce(
      (s, w) => (isSalaryPaid(w.id, year, month) ? s + getNetPayable(w.id, year, month) : s),
      0,
    )
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
    const now = new Date()
    const nowYear = now.getFullYear()
    const nowMonth = now.getMonth()
    let unpaid = 0
    workers.forEach((w) => {
      monthsSinceJoining(w, nowYear, nowMonth).forEach(({ year, month }) => {
        if (!isSalaryPaid(w.id, year, month)) unpaid += getNetPayable(w.id, year, month)
      })
    })
    return unpaid
  }

  // Flatten all lots purchased in a given month into rows
  const getSupplierPaymentRows = (year, month) => {
    const mStr = `${year}-${String(month + 1).padStart(2, '0')}`
    const rows = []
    rawMaterials.forEach((rm) => {
      (rm.lots || []).forEach((lot) => {
        if (lot.purchaseDate && lot.purchaseDate.startsWith(mStr)) {
          const status = supplierPaymentStatus[lot.id] || { status: 'outstanding', paidDate: null }
          rows.push({
            lotId: lot.id,
            rawMaterialId: rm.id,
            vendor: lot.vendor || rm.name,
            materialName: rm.name,
            quantity: lot.quantity,
            unit: rm.unit,
            unitCost: lot.unitCost,
            amount: lot.quantity * lot.unitCost,
            purchaseDate: lot.purchaseDate,
            status: status.status,
            paidDate: status.paidDate,
          })
        }
      })
    })
    return rows
  }

  // Get all lots for a given raw material (any month), excluding one lot, sorted newest first
  const getMaterialPurchaseHistory = (rawMaterialId, excludeLotId) => {
    const rm = rawMaterials.find((r) => r.id === rawMaterialId)
    if (!rm) return []
    return (rm.lots || [])
      .filter((lot) => lot.id !== excludeLotId)
      .map((lot) => {
        const status = supplierPaymentStatus[lot.id] || { status: 'outstanding', paidDate: null }
        return {
          lotId: lot.id,
          rawMaterialId: rm.id,
          vendor: lot.vendor || rm.name,
          materialName: rm.name,
          quantity: lot.quantity,
          unit: rm.unit,
          unitCost: lot.unitCost,
          amount: lot.quantity * lot.unitCost,
          purchaseDate: lot.purchaseDate,
          status: status.status,
          paidDate: status.paidDate,
        }
      })
      .sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate))
  }

  // Sum of lot quantity × unitCost for lots purchased in that month
  const getRawMaterialPurchasedTotal = (year, month) => {
    const rows = getSupplierPaymentRows(year, month)
    return rows.reduce((s, r) => s + r.amount, 0)
  }

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

  // Outstanding totals (supplier + customer)
  const outstandingSupplier = (() => {
    let total = 0
    rawMaterials.forEach((rm) => {
      (rm.lots || []).forEach((lot) => {
        const status = supplierPaymentStatus[lot.id]
        if (!status || status.status === 'outstanding') {
          total += lot.quantity * lot.unitCost
        }
      })
    })
    return total
  })()

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

  // Local/walk-in buyer summary (individuals)
  const getLocalBuyerSummary = () => {
    const localPayments = customerPayments.filter((c) => c.buyerType === 'individual')
    const outstanding = localPayments
      .filter((c) => c.status === 'outstanding')
      .reduce((s, c) => s + (c.amount - (c.amountPaid || 0)), 0)
    const paid = localPayments
      .filter((c) => c.status === 'paid')
      .reduce((s, c) => s + c.amount, 0)
    return { outstanding, paid, storeCount: 0 }
  }

  return {
    expenses, customerPayments, taxEntries, supplierPaymentStatus,
    addCustomerPayment, addPartialPayment, markCustomerPaymentPaid,
    markLotPaid,
    getSalaryForMonth,
    getAdvancesForMonth,
    getNetPayable,
    isSalaryPaid,
    markSalaryPaid,
    markSalaryUnpaid,
    bulkMarkSalaryPaid,
    getPaidTotalForMonth,
    getUnpaidTotal,
    getSupplierPaymentRows,
    getMaterialPurchaseHistory,
    getRawMaterialPurchasedTotal,
    getRawMaterialUsedTotal,
    getProfitAndLoss,
    outstandingSupplier,
    outstandingCustomer,
    getAreaPaymentSummary,
    getStorePaymentSummary,
    getLocalBuyerSummary,
  }
}

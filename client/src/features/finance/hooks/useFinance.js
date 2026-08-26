import { useQueryClient } from '@tanstack/react-query'
import { useLocalQuery, setLocalData } from '@/lib/localStore'
import { useRawMaterials } from '@/features/inventory/hooks'
import { useWorkers } from '@/features/workers/hooks'
import { dailySalaryFromMonthly } from '@/features/workers/utils'
import { seedExpenses, seedCustomerPayments, seedTaxEntries, seedSupplierPaymentStatus } from '../data/seedFinance'

const KEYS = {
  expenses: ['local', 'finance', 'expenses'],
  customerPayments: ['local', 'finance', 'customerPayments'],
  taxEntries: ['local', 'finance', 'taxEntries'],
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
  const { workers, attendance } = useWorkers()

  const { data: expenses = [] } = useLocalQuery(KEYS.expenses, seedExpenses)
  const { data: customerPayments = [] } = useLocalQuery(KEYS.customerPayments, seedCustomerPayments)
  const { data: taxEntries = [] } = useLocalQuery(KEYS.taxEntries, seedTaxEntries)
  const { data: supplierPaymentStatus = {} } = useLocalQuery(KEYS.supplierPaymentStatus, seedSupplierPaymentStatus)

  const addExpense = (data) => {
    const id = 'e' + Date.now()
    setLocalData(queryClient, KEYS.expenses, (p) => [{ id, category: data.category, amount: Number(data.amount) || 0, date: data.date, note: data.note || '' }, ...p])
  }

  const deleteExpense = (id) => {
    setLocalData(queryClient, KEYS.expenses, (p) => p.filter((e) => e.id !== id))
  }

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

  const addTaxEntry = (data) => {
    const id = 't' + Date.now()
    setLocalData(queryClient, KEYS.taxEntries, (p) => [{ id, amount: Number(data.amount) || 0, date: data.date, note: data.note || '' }, ...p])
  }

  const deleteTaxEntry = (id) => {
    setLocalData(queryClient, KEYS.taxEntries, (p) => p.filter((t) => t.id !== id))
  }

  const markLotPaid = (lotId) => {
    setLocalData(queryClient, KEYS.supplierPaymentStatus, (p) => ({ ...p, [lotId]: { status: 'paid', paidDate: new Date().toISOString().slice(0, 10) } }))
  }

  // Get salary for a worker for a given month, using attendance + dailySalaryFromMonthly
  const getSalaryForMonth = (workerId, year, month) => {
    const worker = workers.find((w) => w.id === workerId)
    if (!worker) return { total: 0, present: 0, half: 0, absent: 0, overtime: 0, dailySalary: 0, otRate: 0 }
    const mStr = `${year}-${String(month + 1).padStart(2, '0')}`
    const monthEntries = attendance.filter((a) => a.workerId === workerId && a.date.startsWith(mStr))
    const present = monthEntries.filter((a) => a.status === 'present').length
    const half = monthEntries.filter((a) => a.status === 'half_day').length
    const absent = monthEntries.filter((a) => a.status === 'absent').length
    const overtime = monthEntries.reduce((s, a) => s + (a.overtimeHours || 0), 0)
    const dailySalary = dailySalaryFromMonthly(worker.monthlySalary, year, month, worker.weekOffDay)
    const otRate = worker.overtimeRates || 0
    const total = present * dailySalary + half * 0.5 * dailySalary + overtime * otRate
    return { total, present, half, absent, overtime, dailySalary, otRate }
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
    addExpense, deleteExpense,
    addCustomerPayment, addPartialPayment, markCustomerPaymentPaid,
    addTaxEntry, deleteTaxEntry,
    markLotPaid,
    getSalaryForMonth,
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

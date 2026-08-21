import { createContext, useState, useCallback, useMemo } from 'react'
import { useInventory } from '@/features/inventory/hooks'
import { useWorkers } from '@/features/workers/hooks'
import { dailySalaryFromMonthly } from '@/features/workers/utils'
import { seedExpenses, seedCustomerPayments, seedTaxEntries, seedSupplierPaymentStatus } from '../data/seedFinance'

export const FinanceContext = createContext(null)

export function FinanceProvider({ children }) {
  const { rawMaterials, batches } = useInventory()
  const { workers, attendance } = useWorkers()

  const [expenses, setExpenses] = useState(seedExpenses)
  const [customerPayments, setCustomerPayments] = useState(seedCustomerPayments)
  const [taxEntries, setTaxEntries] = useState(seedTaxEntries)
  const [supplierPaymentStatus, setSupplierPaymentStatus] = useState(seedSupplierPaymentStatus)

  const addExpense = useCallback((data) => {
    const id = 'e' + Date.now()
    setExpenses((p) => [{ id, category: data.category, amount: Number(data.amount) || 0, date: data.date, note: data.note || '' }, ...p])
  }, [])

  const deleteExpense = useCallback((id) => {
    setExpenses((p) => p.filter((e) => e.id !== id))
  }, [])

  const addCustomerPayment = useCallback((data) => {
    const id = 'cp' + Date.now()
    setCustomerPayments((p) => [{ id, buyerName: data.buyerName, buyerType: data.buyerType || 'store', storeId: data.storeId || null, areaId: data.areaId || null, amount: Number(data.amount) || 0, amountPaid: 0, paymentHistory: [], date: data.date, status: 'outstanding', paidDate: null }, ...p])
  }, [])

  const addPartialPayment = useCallback((id, partialAmount) => {
    setCustomerPayments((p) => p.map((c) => {
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
  }, [])

  const markCustomerPaymentPaid = useCallback((id) => {
    const todayStr = new Date().toISOString().slice(0, 10)
    setCustomerPayments((p) => p.map((c) => {
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
  }, [])

  const addTaxEntry = useCallback((data) => {
    const id = 't' + Date.now()
    setTaxEntries((p) => [{ id, amount: Number(data.amount) || 0, date: data.date, note: data.note || '' }, ...p])
  }, [])

  const deleteTaxEntry = useCallback((id) => {
    setTaxEntries((p) => p.filter((t) => t.id !== id))
  }, [])

  const markLotPaid = useCallback((lotId) => {
    setSupplierPaymentStatus((p) => ({ ...p, [lotId]: { status: 'paid', paidDate: new Date().toISOString().slice(0, 10) } }))
  }, [])

  // Get salary for a worker for a given month, using attendance + dailySalaryFromMonthly
  const getSalaryForMonth = useCallback((workerId, year, month) => {
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
  }, [workers, attendance])

  // Flatten all lots purchased in a given month into rows
  const getSupplierPaymentRows = useCallback((year, month) => {
    const mStr = `${year}-${String(month + 1).padStart(2, '0')}`
    const rows = []
    rawMaterials.forEach((rm) => {
      rm.lots.forEach((lot) => {
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
  }, [rawMaterials, supplierPaymentStatus])

  // Get all lots for a given raw material (any month), excluding one lot, sorted newest first
  const getMaterialPurchaseHistory = useCallback((rawMaterialId, excludeLotId) => {
    const rm = rawMaterials.find((r) => r.id === rawMaterialId)
    if (!rm) return []
    return rm.lots
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
  }, [rawMaterials, supplierPaymentStatus])

  // Sum of lot quantity × unitCost for lots purchased in that month
  const getRawMaterialPurchasedTotal = useCallback((year, month) => {
    const rows = getSupplierPaymentRows(year, month)
    return rows.reduce((s, r) => s + r.amount, 0)
  }, [getSupplierPaymentRows])

  // Sum of ingredient cost consumed by batches in that month
  // Approximate using each material's most recent lot cost
  const getRawMaterialUsedTotal = useCallback((year, month) => {
    const mStr = `${year}-${String(month + 1).padStart(2, '0')}`
    const monthBatches = batches.filter((b) => b.date && b.date.startsWith(mStr))
    let total = 0
    monthBatches.forEach((batch) => {
      batch.ingredientsUsed.forEach((iu) => {
        const rm = rawMaterials.find((r) => r.id === iu.rawMaterialId)
        if (!rm || rm.lots.length === 0) return
        // Most recent lot cost as approximation
        const sortedLots = [...rm.lots].sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate))
        const unitCost = sortedLots[0].unitCost
        total += iu.qty * unitCost
      })
    })
    return total
  }, [batches, rawMaterials])

  // Profit & Loss for a month
  const getProfitAndLoss = useCallback((year, month) => {
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
  }, [customerPayments, getRawMaterialPurchasedTotal, getRawMaterialUsedTotal, workers, getSalaryForMonth, expenses, taxEntries])

  // Outstanding totals (supplier + customer)
  const outstandingSupplier = useMemo(() => {
    let total = 0
    rawMaterials.forEach((rm) => {
      rm.lots.forEach((lot) => {
        const status = supplierPaymentStatus[lot.id]
        if (!status || status.status === 'outstanding') {
          total += lot.quantity * lot.unitCost
        }
      })
    })
    return total
  }, [rawMaterials, supplierPaymentStatus])

  const outstandingCustomer = useMemo(() => {
    return customerPayments
      .filter((c) => c.status === 'outstanding')
      .reduce((s, c) => s + (c.amount - (c.amountPaid || 0)), 0)
  }, [customerPayments])

  // Area-level payment summary
  const getAreaPaymentSummary = useCallback((areaId) => {
    const areaPayments = customerPayments.filter((c) => c.areaId === areaId)
    const outstanding = areaPayments
      .filter((c) => c.status === 'outstanding')
      .reduce((s, c) => s + (c.amount - (c.amountPaid || 0)), 0)
    const paid = areaPayments
      .filter((c) => c.status === 'paid')
      .reduce((s, c) => s + c.amount, 0)
    const storeIds = new Set(areaPayments.filter((c) => c.storeId).map((c) => c.storeId))
    return { outstanding, paid, storeCount: storeIds.size }
  }, [customerPayments])

  // Store-level payment summary with entries
  const getStorePaymentSummary = useCallback((storeId) => {
    const storePayments = customerPayments.filter((c) => c.storeId === storeId)
    const outstanding = storePayments
      .filter((c) => c.status === 'outstanding')
      .reduce((s, c) => s + (c.amount - (c.amountPaid || 0)), 0)
    const paid = storePayments
      .filter((c) => c.status === 'paid')
      .reduce((s, c) => s + c.amount, 0)
    const totalBilled = storePayments.reduce((s, c) => s + c.amount, 0)
    return { outstanding, paid, totalBilled, entries: storePayments }
  }, [customerPayments])

  // Local/walk-in buyer summary (individuals)
  const getLocalBuyerSummary = useCallback(() => {
    const localPayments = customerPayments.filter((c) => c.buyerType === 'individual')
    const outstanding = localPayments
      .filter((c) => c.status === 'outstanding')
      .reduce((s, c) => s + (c.amount - (c.amountPaid || 0)), 0)
    const paid = localPayments
      .filter((c) => c.status === 'paid')
      .reduce((s, c) => s + c.amount, 0)
    return { outstanding, paid, storeCount: 0 }
  }, [customerPayments])

  const value = {
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

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  )
}


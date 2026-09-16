import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { useWorkers, useAllAttendance } from '@/features/workers/hooks'
import { computeGrossSalaryForMonth } from '@/features/workers/utils'
import { useAllLots, useBatches } from '@/features/inventory/hooks'
import { rawMaterialApi } from '@/features/inventory/api/rawMaterialApi'
import { rawMaterialKeys } from '@/features/inventory/hooks/useRawMaterials'
import { batchApi } from '@/features/inventory/api/batchApi'
import { batchKeys } from '@/features/inventory/hooks/useBatches'
import { customerPaymentApi } from '../api/customerPaymentApi'
import { customerPaymentKeys, usePaymentsPeriodTotal } from './useCustomerPayments'
import { useExpenses } from './useExpenses'
import { useTaxEntries } from './useTaxEntries'
import { monthRangeISO } from '@/utils'

// Pure P&L math for one month, given already-scoped data for that month.
// Shared by useProfitAndLoss (a single month) and useProfitAndLossTrend
// (several months at once) so the formula only lives in one place.
const computePnlFigures = ({ year, month, workers, attendance, expenses, taxEntries, lots, batches, salesTotal }) => {
  const mStr = `${year}-${String(month + 1).padStart(2, '0')}`
  const salaries = workers.reduce(
    (s, w) => s + computeGrossSalaryForMonth(w, attendance.filter((a) => a.workerId === w.id), year, month).total,
    0,
  )
  const expensesTotal = expenses.filter((e) => e.date.startsWith(mStr)).reduce((s, e) => s + e.amount, 0)
  const taxes = taxEntries.filter((t) => t.date.startsWith(mStr)).reduce((s, t) => s + t.amount, 0)
  // Sum of lot originalQty x unitCost for lots purchased in the month -
  // what actually went out the door to suppliers.
  const rawMaterialsPurchased = lots.reduce((s, lot) => s + lot.originalQty * lot.unitCost, 0)
  // Sum of ingredient cost consumed by batches produced in the month -
  // "reference only" in the UI, not subtracted from profit (Purchased
  // already accounts for the cash outflow).
  const rawMaterialsUsed = batches.reduce((s, b) => s + (b.totalIngredientCost || 0), 0)
  const sales = salesTotal || 0
  const profit = sales - rawMaterialsPurchased - salaries - expensesTotal - taxes

  return { sales, rawMaterialsPurchased, rawMaterialsUsed, salaries, expenses: expensesTotal, taxes, profit }
}

// P&L for a single (year, month) - Profit & Loss page and FinanceOverview's
// "this month" cards.
export function useProfitAndLoss(year, month) {
  const { data: workers = [], isLoading: workersLoading } = useWorkers()
  const { data: attendance = [], isLoading: attendanceLoading } = useAllAttendance()
  const { data: expenses = [], isLoading: expensesLoading } = useExpenses()
  const { data: taxEntries = [], isLoading: taxLoading } = useTaxEntries()

  const range = useMemo(() => monthRangeISO(year, month), [year, month])
  const { data: lots = [], isLoading: lotsLoading } = useAllLots(range)
  const { data: batches = [], isLoading: batchesLoading } = useBatches({ filter: 'custom', ...range })
  const { data: salesResult, isLoading: salesLoading } = usePaymentsPeriodTotal(range)

  const isLoading =
    workersLoading || attendanceLoading || expensesLoading || taxLoading || lotsLoading || batchesLoading || salesLoading

  const data = useMemo(
    () =>
      computePnlFigures({
        year,
        month,
        workers,
        attendance,
        expenses,
        taxEntries,
        lots,
        batches,
        salesTotal: salesResult?.total,
      }),
    [year, month, workers, attendance, expenses, taxEntries, lots, batches, salesResult],
  )

  return { data, isLoading }
}

// P&L for several months at once - FinanceOverview's 6-month profit trend
// chart. Reuses the already-loaded, unscoped workers/attendance/expenses/
// taxEntries (same client-side-filter-per-month pattern as useFinance's
// salary/expense/tax totals) but fetches lots/batches/sales per month via
// useQueries, since those three are deliberately bounded server-side
// queries rather than an unscoped table fetch.
export function useProfitAndLossTrend(monthsList) {
  const { data: workers = [] } = useWorkers()
  const { data: attendance = [] } = useAllAttendance()
  const { data: expenses = [] } = useExpenses()
  const { data: taxEntries = [] } = useTaxEntries()

  const ranges = useMemo(() => monthsList.map(({ year, month }) => monthRangeISO(year, month)), [monthsList])

  const lotsQueries = useQueries({
    queries: ranges.map((range) => ({
      queryKey: rawMaterialKeys.allLots(range),
      queryFn: async () => (await rawMaterialApi.allLots(range)).lots,
    })),
  })
  const batchQueries = useQueries({
    queries: ranges.map((range) => ({
      queryKey: batchKeys.list({ filter: 'custom', ...range }),
      queryFn: async () => (await batchApi.list({ filter: 'custom', ...range })).batches,
    })),
  })
  const salesQueries = useQueries({
    queries: ranges.map((range) => ({
      queryKey: customerPaymentKeys.periodTotal(range),
      queryFn: () => customerPaymentApi.periodTotal(range),
    })),
  })

  const isLoading = [...lotsQueries, ...batchQueries, ...salesQueries].some((q) => q.isLoading)

  const data = monthsList.map(({ year, month }, i) =>
    computePnlFigures({
      year,
      month,
      workers,
      attendance,
      expenses,
      taxEntries,
      lots: lotsQueries[i]?.data || [],
      batches: batchQueries[i]?.data || [],
      salesTotal: salesQueries[i]?.data?.total,
    }),
  )

  return { data, isLoading }
}

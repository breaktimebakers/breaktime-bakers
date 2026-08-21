import { useContext } from 'react'
import { FinanceContext } from '@/features/finance/context/FinanceContext'

export function useFinance() {
  const ctx = useContext(FinanceContext)
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider')
  return ctx
}

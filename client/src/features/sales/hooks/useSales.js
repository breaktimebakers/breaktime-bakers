import { useContext } from 'react'
import { SalesContext } from '@/features/sales/context/SalesContext'

export function useSales() {
  const ctx = useContext(SalesContext)
  if (!ctx) throw new Error('useSales must be used within SalesProvider')
  return ctx
}

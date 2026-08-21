import { useContext } from 'react'
import { InventoryContext } from '@/features/inventory/context/InventoryContext'

export function useInventory() {
  const ctx = useContext(InventoryContext)
  if (!ctx) throw new Error('useInventory must be used within InventoryProvider')
  return ctx
}

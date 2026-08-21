import { InventoryProvider } from '@/features/inventory/context/InventoryContext'
import { SalesProvider } from '@/features/sales/context/SalesContext'
import { DeliveryProvider } from '@/features/delivery/context/DeliveryContext'
import { WorkersProvider } from '@/features/workers/context/WorkersContext'
import { FinanceProvider } from '@/features/finance/context/FinanceContext'

const providers = [
  InventoryProvider,
  SalesProvider,
  DeliveryProvider,
  WorkersProvider,
  FinanceProvider,
]

export function AppProviders({ children }) {
  return providers.reduceRight(
    (tree, Provider) => <Provider>{tree}</Provider>,
    children,
  )
}

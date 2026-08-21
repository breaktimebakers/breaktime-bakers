import { createRoute } from '@tanstack/react-router'
import { rootRoute } from '@/router/rootRoute'

import FinanceOverview from './pages/FinanceOverview'
import Salary from './pages/Salary'
import Expenses from './pages/Expenses'
import SupplierPayments from './pages/SupplierPayments'
import CustomerPayments from './pages/CustomerPayments'
import CustomerPaymentsArea from './pages/CustomerPaymentsArea'
import CustomerPaymentsStore from './pages/CustomerPaymentsStore'
import CustomerPaymentsLocal from './pages/CustomerPaymentsLocal'
import Taxes from './pages/Taxes'
import ProfitAndLoss from './pages/ProfitAndLoss'

const financeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/finance', component: FinanceOverview })
const salaryRoute = createRoute({ getParentRoute: () => rootRoute, path: '/finance/salary', component: Salary })
const expensesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/finance/expenses', component: Expenses })
const supplierPaymentsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/finance/supplier-payments', component: SupplierPayments })
const customerPaymentsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/finance/customer-payments', component: CustomerPayments })
const customerPaymentsLocalRoute = createRoute({ getParentRoute: () => rootRoute, path: '/finance/customer-payments/local', component: CustomerPaymentsLocal })
const customerPaymentsAreaRoute = createRoute({ getParentRoute: () => rootRoute, path: '/finance/customer-payments/$areaId', component: CustomerPaymentsArea })
const customerPaymentsStoreRoute = createRoute({ getParentRoute: () => rootRoute, path: '/finance/customer-payments/$areaId/$storeId', component: CustomerPaymentsStore })
const taxesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/finance/taxes', component: Taxes })
const profitLossRoute = createRoute({ getParentRoute: () => rootRoute, path: '/finance/profit-loss', component: ProfitAndLoss })

export const financeRoutes = [
  financeRoute,
  salaryRoute,
  expensesRoute,
  supplierPaymentsRoute,
  customerPaymentsRoute,
  customerPaymentsLocalRoute,
  customerPaymentsAreaRoute,
  customerPaymentsStoreRoute,
  taxesRoute,
  profitLossRoute,
]

import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { Warehouse, Wheat, CookingPot, PackageCheck, Receipt, MapPin, ClipboardList, Users, Truck, UserRound, Route, Wallet, X, Menu, CalendarCheck, LogOut, HandCoins, Landmark, TrendingUp } from 'lucide-react'
import { useAuth } from '@/features/auth/hooks'

const navConfig = [
  {
    label: 'Inventory', icon: Warehouse, path: '/inventory',
    children: [
      { label: 'Overview', path: '/inventory' },
      { label: 'Raw Materials', path: '/inventory/raw-materials', icon: Wheat },
      { label: 'In Process', path: '/inventory/in-process', icon: CookingPot },
      { label: 'Ready Stock', path: '/inventory/ready', icon: PackageCheck },
    ],
  },
  {
    label: 'Sales', icon: Receipt, path: '/sales',
    children: [
      { label: 'Overview', path: '/sales' },
      { label: 'Areas', path: '/sales/areas', icon: MapPin },
      { label: 'Orders', path: '/sales/orders', icon: ClipboardList },
      { label: 'Order Takers', path: '/sales/orders/order-takers', icon: Users },
    ],
  },
  {
    label: 'Delivery', icon: Truck, path: '/delivery',
    children: [
      { label: 'Overview', path: '/delivery' },
      { label: 'Drivers', path: '/delivery/drivers', icon: UserRound },
      { label: 'Trips', path: '/delivery/trips', icon: Route },
    ],
  },
  {
    label: 'Workers', icon: Users, path: '/workers',
    children: [
      { label: 'All Workers', path: '/workers' },
      { label: 'Attendance', path: '/workers/attendance', icon: CalendarCheck },
    ],
  },
  {
    label: 'Finance', icon: Wallet, path: '/finance',
    children: [
      { label: 'Overview', path: '/finance' },
      { label: 'Salary', path: '/finance/salary', icon: Users },
      { label: 'Expenses', path: '/finance/expenses', icon: Receipt },
      { label: 'Supplier Payments', path: '/finance/supplier-payments', icon: Truck },
      { label: 'Customer Payments', path: '/finance/customer-payments', icon: HandCoins },
      { label: 'Taxes', path: '/finance/taxes', icon: Landmark },
      { label: 'Profit & Loss', path: '/finance/profit-loss', icon: TrendingUp },
    ],
  },
]

function NavLinks({ onNavigate }) {
  const location = useLocation()
  const pathname = location.pathname
  const [expanded, setExpanded] = useState(() => {
    const top = '/' + pathname.split('/')[1]
    return { '/inventory': true, '/sales': true, '/delivery': true, [top]: true }
  })

  const toggle = (path) => setExpanded((p) => ({ ...p, [path]: !p[path] }))

  return (
    <nav className="flex flex-col gap-1 px-3">
      <p className="px-3 pt-4 pb-2 text-[10px] font-mono uppercase tracking-wider text-crust/40">Workspace</p>
      {navConfig.map((item) => {
        const Icon = item.icon
        const hasChildren = !!item.children
        const isActive = hasChildren ? pathname === item.path : pathname === item.path
        const isChildActive = hasChildren && item.children.some((c) => pathname === c.path)
        const isOpen = expanded[item.path] || isChildActive

        return (
          <div key={item.path}>
            <div
              onClick={() => hasChildren ? toggle(item.path) : null}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer ${
                isActive && !hasChildren
                  ? 'bg-oven-amber text-espresso font-medium'
                  : isChildActive
                    ? 'text-crust'
                    : 'text-crust/70 hover:bg-crust/10'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <Link to={item.path} className="flex-1" onClick={onNavigate}>
                {item.label}
              </Link>
              {hasChildren && (
                <svg
                  className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              )}
            </div>
            {hasChildren && isOpen && (
              <div className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l border-crust/15 pl-3">
                {item.children.map((child) => {
                  const ChildIcon = child.icon
                  const childActive = pathname === child.path && !(child.path === '/inventory' || child.path === '/sales' || child.path === '/delivery')
                  return (
                    <Link
                      key={child.path}
                      to={child.path}
                      onClick={onNavigate}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                        childActive
                          ? 'bg-oven-amber text-espresso font-medium'
                          : 'text-crust/60 hover:bg-crust/10'
                      }`}
                    >
                      {ChildIcon && <ChildIcon className="h-3.5 w-3.5 shrink-0" />}
                      {child.label}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}

function SidebarContent({ onNavigate }) {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      // Navigate even if the request itself failed (network error, etc.) -
      // the cache is already cleared optimistically, so the user is
      // treated as signed out client-side regardless.
      navigate({ to: '/login' })
    }
  }

  return (
    <div className="flex h-full flex-col bg-espresso text-crust">
      <div className="flex items-center gap-3 px-5 pt-5 pb-4">
        <img src="/breakTimeLogo.png" alt="Break Times" className="h-10 w-10 rounded-bakery object-cover" />
        <div>
          <h1 className="font-display text-lg font-semibold leading-tight">Break Times</h1>
          <p className="font-mono text-[10px] uppercase tracking-wider text-crust/50">Bakery admin</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto pb-4">
        <NavLinks onNavigate={onNavigate} />
      </div>
      <div className="border-t border-crust/10 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-oven-amber/20 text-oven-amber font-mono text-xs font-semibold">
            {currentUser?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'AK'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{currentUser?.name || 'Administrator'}</p>
            <p className="truncate text-xs text-crust/50">{currentUser?.role || 'Admin'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-crust/50 hover:bg-crust/10 hover:text-crust"
            aria-label="Log out"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function AppShell({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  return (
    <div className="min-h-screen bg-crust">
      {/* Desktop sidebar */}
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile sticky header */}
      <header className="no-print sticky top-0 z-20 flex items-center justify-between bg-espresso px-4 py-3 text-crust lg:hidden">
        <div className="flex items-center gap-2.5">
          <img src="/breakTimeLogo.png" alt="Break Times" className="h-8 w-8 rounded-bakery object-cover" />
          <span className="font-display text-base font-semibold">Break Times</span>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-crust hover:bg-crust/10"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="no-print lg:hidden">
          <div
            className="fixed inset-0 z-40 bg-espresso/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] animate-slide-in">
            <div className="relative h-full">
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Close navigation"
                className="absolute right-3 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-crust/70 hover:bg-crust/10"
              >
                <X className="h-5 w-5" />
              </button>
              <SidebarContent onNavigate={() => setDrawerOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="lg:pl-64">
        <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  )
}

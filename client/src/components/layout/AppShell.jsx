import { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { Warehouse, Wheat, CookingPot, PackageCheck, Receipt, MapPin, ClipboardList, Users, Truck, UserRound, Route, Wallet, X, Menu, CalendarCheck, LogOut, HandCoins, Landmark, TrendingUp, Search } from 'lucide-react'
import { ConfirmModal } from '@/components/shared'
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
      { label: 'All Workers', path: '/workers', icon: Users },
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

const getActiveTopPath = (pathname) => {
  const matched = navConfig.find((item) => (
    pathname === item.path || item.children?.some((child) => child.path === pathname)
  ))
  return matched?.path
}

const moduleSearchItems = navConfig.flatMap((item) => {
  const parentItem = {
    label: item.label,
    path: item.path,
    section: 'Module',
    icon: item.icon,
  }

  const childItems = item.children?.map((child) => ({
    label: child.label,
    path: child.path,
    section: item.label,
    icon: child.icon ?? item.icon,
  })) ?? []

  return [parentItem, ...childItems]
})

function ModuleSearch({ inputRef, onNavigate }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const normalizedQuery = query.trim().toLowerCase()
  const matches = useMemo(() => {
    if (!normalizedQuery) return []
    return moduleSearchItems
      .filter((item) => `${item.label} ${item.section}`.toLowerCase().includes(normalizedQuery))
      .slice(0, 8)
  }, [normalizedQuery])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  const openResult = (item) => {
    if (!item) return
    setQuery('')
    navigate({ to: item.path })
    onNavigate?.()
  }

  const handleKeyDown = (event) => {
    if (!matches.length) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((current) => (current + 1) % matches.length)
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((current) => (current - 1 + matches.length) % matches.length)
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      openResult(matches[activeIndex])
    }
  }

  return (
    <div className="px-3 pb-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-crust/40" />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          type="search"
          placeholder='Press "/" to search'
          className="h-10 w-full rounded-lg border border-crust/10 bg-crust/10 pl-9 pr-3 text-sm text-crust outline-none transition placeholder:text-crust/35 focus:border-oven-amber/60 focus:bg-crust/15 focus:ring-2 focus:ring-oven-amber/20"
        />
      </div>

      {normalizedQuery && (
        <div className="mt-2 overflow-hidden rounded-lg border border-crust/10 bg-crust/10 p-1 shadow-bakery">
          {matches.length ? (
            matches.map((item, index) => {
              const Icon = item.icon
              return (
                <button
                  key={`${item.section}-${item.path}`}
                  type="button"
                  onClick={() => openResult(item)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors ${
                    index === activeIndex
                      ? 'bg-oven-amber text-espresso'
                      : 'text-crust/75 hover:bg-crust/10 hover:text-crust'
                  }`}
                >
                  {Icon && <Icon className="h-4 w-4 shrink-0" />}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{item.label}</span>
                    <span className={`block truncate text-[11px] ${index === activeIndex ? 'text-espresso/65' : 'text-crust/40'}`}>
                      {item.section}
                    </span>
                  </span>
                </button>
              )
            })
          ) : (
            <p className="px-2.5 py-2 text-sm text-crust/50">No module found</p>
          )}
        </div>
      )}
    </div>
  )
}

function NavLinks({ onNavigate }) {
  const location = useLocation()
  const pathname = location.pathname
  const [expanded, setExpanded] = useState(() => {
    const activeTop = getActiveTopPath(pathname)
    return activeTop ? { [activeTop]: true } : {}
  })

  const toggle = (path) => setExpanded((p) => ({ ...p, [path]: !p[path] }))

  useEffect(() => {
    const activeTop = getActiveTopPath(pathname)
    if (activeTop) {
      setExpanded((current) => ({ ...current, [activeTop]: true }))
    }
  }, [pathname])

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
                  const childActive = pathname === child.path
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
  const { currentUser, logout, isLoggingOut } = useAuth()
  const navigate = useNavigate()
  const searchInputRef = useRef(null)
  const [logoutModalOpen, setLogoutModalOpen] = useState(false)

  useEffect(() => {
    const handleShortcut = (event) => {
      const target = event.target
      const isTyping = target instanceof HTMLElement
        && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)

      if (event.key === '/' && !isTyping && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault()
        searchInputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

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
          <p className="text-center font-mono text-[10px] uppercase tracking-wider text-crust/50">Bakers</p>
        </div>
      </div>
      <ModuleSearch inputRef={searchInputRef} onNavigate={onNavigate} />
      <div className="sidebar-nav-scroll flex-1 overflow-y-auto pb-4">
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
            onClick={() => setLogoutModalOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-crust/50 hover:bg-crust/10 hover:text-crust"
            aria-label="Log out"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
      <ConfirmModal
        open={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        onConfirm={handleLogout}
        title="Log out?"
        description="You will be signed out of the bakery admin dashboard on this device."
        confirmLabel="Log out"
        tone="danger"
        isLoading={isLoggingOut}
      />
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

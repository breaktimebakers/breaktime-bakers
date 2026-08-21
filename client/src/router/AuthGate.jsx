import { Outlet } from '@tanstack/react-router'
import { useAuth } from '@/features/auth/hooks'
import { AppProviders } from '@/providers/AppProviders'
import { AppShell } from '@/components/layout/AppShell'
import Login from '@/features/auth/pages/Login'

export function AuthGate() {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Login />

  return (
    <AppProviders>
      <AppShell>
        <Outlet />
      </AppShell>
    </AppProviders>
  )
}

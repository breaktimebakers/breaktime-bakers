import { createRootRoute } from '@tanstack/react-router'
import { AuthProvider } from '@/features/auth/context/AuthContext'
import { AuthGate } from './AuthGate'

export const rootRoute = createRootRoute({
  component: () => (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  ),
})

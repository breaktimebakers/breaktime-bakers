import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '@/lib/apiClient'
import { toast } from '@/lib/toast'
import { authApi } from '../api/authApi'

export const authKeys = {
  me: ['auth', 'me'],
}

export const AUTH_ME_STALE_TIME_MS = 2 * 60 * 1000

// GET /auth/me is expected to 401 for a signed-out visitor - that's a
// normal "not logged in" result, not a failure, so it resolves to null
// instead of surfacing as a query error.
export async function fetchCurrentUser() {
  try {
    const { user } = await authApi.me()
    return user
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null
    throw err
  }
}

export function useAuth() {
  const queryClient = useQueryClient()

  const meQuery = useQuery({
    queryKey: authKeys.me,
    queryFn: fetchCurrentUser,
    staleTime: AUTH_ME_STALE_TIME_MS,
    retry: false,
  })

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ user }) => {
      queryClient.setQueryData(authKeys.me, user)
    },
  })

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onMutate: () => {
      // Clear the session optimistically, before the network call even
      // resolves, so any protected UI reacts immediately rather than
      // waiting on the request.
      queryClient.setQueryData(authKeys.me, null)
    },
    onSettled: (_data, error) => {
      // Wipe every cached query, not just auth/me - the next admin to
      // log in on this device must never see the previous admin's data.
      // Done whether the request succeeded or failed: the user is
      // treated as signed out client-side either way (AppShell navigates
      // to /login regardless - see its handleLogout).
      queryClient.clear()

      if (error) {
        toast.error('Could not confirm logout with the server', {
          description: 'You have been signed out on this device, but the session may still be active elsewhere.',
        })
      }
    },
  })

  return {
    currentUser: meQuery.data ?? null,
    isAuthenticated: !!meQuery.data,
    isLoading: meQuery.isLoading,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    // mutateAsync (not mutate) - callers must await this before
    // navigating away, otherwise they can redirect to /login before the
    // server has actually cleared the session cookie, and the login
    // route's own auth check can still see a valid session.
    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
  }
}

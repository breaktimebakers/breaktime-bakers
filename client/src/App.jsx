import { useEffect, useState } from 'react'
import { RouterProvider } from '@tanstack/react-router'
import { router } from '@/router'
import { Toaster } from '@/components/shared'
import SplashScreen from '@/components/SplashScreen'
import ComingSoon from '@/pages/ComingSoon'
import { useAuth } from '@/features/auth/hooks'

// The admin panel now lives at /furjaden (an unguessable path, kept out of
// robots.txt) instead of "/" - a visitor at the bare domain sees the public
// coming-soon page instead, so the admin app never has to be the thing
// search engines or randos land on.
export default function App() {
  const isAdminPath = window.location.pathname.startsWith('/furjaden')

  return isAdminPath ? <AdminApp /> : <ComingSoon />
}

function AdminApp() {
  const [showSplash, setShowSplash] = useState(true)
  const [isSplashLeaving, setIsSplashLeaving] = useState(false)
  const { isLoading: isAuthLoading } = useAuth()

  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    return () => document.head.removeChild(meta)
  }, [])

  useEffect(() => {
    if (isAuthLoading) return undefined

    setIsSplashLeaving(true)
    const removeTimer = window.setTimeout(() => setShowSplash(false), 450)

    return () => window.clearTimeout(removeTimer)
  }, [isAuthLoading])

  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
      {showSplash && <SplashScreen isLeaving={isSplashLeaving} />}
    </>
  )
}

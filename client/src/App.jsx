import { useEffect, useState } from 'react'
import { RouterProvider } from '@tanstack/react-router'
import { router } from '@/router'
import { Toaster } from '@/components/shared'
import SplashScreen from '@/components/SplashScreen'
import { useAuth } from '@/features/auth/hooks'

export default function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [isSplashLeaving, setIsSplashLeaving] = useState(false)
  const { isLoading: isAuthLoading } = useAuth()

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

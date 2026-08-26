import { useEffect, useState } from 'react'
import { RouterProvider } from '@tanstack/react-router'
import { router } from '@/router'
import { Toaster } from '@/components/shared'
import SplashScreen from '@/components/SplashScreen'

export default function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [isSplashLeaving, setIsSplashLeaving] = useState(false)

  useEffect(() => {
    const leaveTimer = window.setTimeout(() => {
      setIsSplashLeaving(true)
    }, 1800)
    const removeTimer = window.setTimeout(() => {
      setShowSplash(false)
    }, 2300)

    return () => {
      window.clearTimeout(leaveTimer)
      window.clearTimeout(removeTimer)
    }
  }, [])

  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
      {showSplash && <SplashScreen isLeaving={isSplashLeaving} />}
    </>
  )
}

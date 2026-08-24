import { RouterProvider } from '@tanstack/react-router'
import { router } from '@/router'
import { Toaster } from '@/components/shared'

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  )
}

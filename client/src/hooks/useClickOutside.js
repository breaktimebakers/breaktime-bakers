import { useEffect, useRef } from 'react'

export function useClickOutside(active, onOutside) {
  const ref = useRef(null)
  // Kept in a ref so an inline callback doesn't resubscribe the listener each render.
  const callbackRef = useRef(onOutside)
  callbackRef.current = onOutside

  useEffect(() => {
    if (!active) return
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) callbackRef.current()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [active])

  return ref
}

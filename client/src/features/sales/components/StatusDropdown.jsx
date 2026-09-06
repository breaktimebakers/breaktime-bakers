import { useState, useRef, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown } from 'lucide-react'
import { ORDER_STATUS } from '@/constants/orderStatus'

// The menu is portaled to document.body rather than absolutely positioned
// inside the trigger - this button sits in a table wrapped in
// overflow-x-auto, and setting overflow-x alone still makes overflow-y
// compute to "auto" (not "visible") per the CSS spec, so an
// absolutely-positioned popup extending below the row was getting
// clipped by that scroll container instead of floating above it.
export function StatusDropdown({ order, onUpdate }) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState(null)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const cfg = ORDER_STATUS[order.status]

  useLayoutEffect(() => {
    if (!open) return

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (rect) setCoords({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
    }
    updatePosition()

    // Closes rather than re-tracking on scroll (of the page or the
    // table's own horizontal scroller, hence the capture phase) - simpler
    // than continuously repositioning a fixed-position menu, and standard
    // dropdown behavior.
    const close = () => setOpen(false)
    const handleClickOutside = (e) => {
      if (triggerRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return
      setOpen(false)
    }

    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-espresso/15 bg-proof-cream px-2.5 py-1.5 text-xs font-medium text-espresso hover:bg-sourdough/30"
      >
        <cfg.icon className={`h-3.5 w-3.5 ${cfg.color}`} /> {cfg.label}
        <ChevronDown className="h-3 w-3 text-espresso/40" />
      </button>
      {open && coords && createPortal(
        <div
          ref={menuRef}
          style={{ position: 'fixed', top: coords.top, right: coords.right }}
          className="z-50 w-36 overflow-hidden rounded-bakery border border-espresso/10 bg-proof-cream shadow-bakery-lg"
        >
          {/* "Delivered" is deliberately excluded - the server now requires
              fulfillment date + per-item quantities for that transition,
              which this menu doesn't collect. Use the "Fill" button instead. */}
          {Object.entries(ORDER_STATUS).filter(([key]) => key !== 'delivered').map(([key, sc]) => (
            <button
              key={key}
              onClick={() => { onUpdate(key); setOpen(false) }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-espresso hover:bg-sourdough/30"
            >
              <sc.icon className={`h-3.5 w-3.5 ${sc.color}`} /> {sc.label}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  )
}

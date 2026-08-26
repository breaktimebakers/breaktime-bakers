import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { subscribeToasts, toast } from '@/lib/toast'

// Same rotated ink-stamp badge used for "Produced" / "Ready" on the
// batch and ready-stock cards, not a generic status icon - so a toast
// reads as this app's, not a library default.
const TONE = {
  success: { label: 'Done', ring: 'border-matcha-glaze/25', color: 'text-matcha-glaze', bar: 'bg-matcha-glaze' },
  error: { label: 'Error', ring: 'border-cherry-compote/25', color: 'text-cherry-compote', bar: 'bg-cherry-compote' },
  info: { label: 'Note', ring: 'border-oven-amber/25', color: 'text-oven-amber', bar: 'bg-oven-amber' },
}

export function Toaster() {
  const [toasts, setToasts] = useState([])

  useEffect(() => subscribeToasts(setToasts), [])

  if (toasts.length === 0) return null

  return (
    <div
      className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col items-end sm:right-6 sm:top-6"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((t) => {
        const tone = TONE[t.type] || TONE.info

        return (
          <div
            key={t.id}
            className={`pointer-events-auto relative mb-2.5 w-full overflow-hidden rounded-bakery border ${tone.ring} bg-proof-cream shadow-bakery-lg ${t.closing ? 'animate-toast-out' : 'animate-toast-in'}`}
          >
            <div className="flex items-start gap-3 px-4 py-3.5">
              <span className={`stamp shrink-0 ${tone.color}`}>{tone.label}</span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm font-medium leading-snug text-espresso">{t.message}</p>
                {t.description && <p className="mt-0.5 text-xs leading-snug text-espresso/60">{t.description}</p>}
              </div>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="shrink-0 rounded-md p-0.5 text-espresso/30 transition hover:bg-espresso/5 hover:text-espresso/60"
                aria-label="Dismiss notification"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            {!t.closing && Number.isFinite(t.duration) && (
              <div
                className={`animate-toast-progress absolute bottom-0 left-0 h-0.5 w-full origin-left ${tone.bar}`}
                style={{ animationDuration: `${t.duration}ms` }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

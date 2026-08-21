import { useEffect } from 'react'
import { X } from 'lucide-react'

export function Modal({ open, onClose, eyebrow, title, children, footer }) {
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-espresso/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl bg-proof-cream shadow-bakery-lg sm:rounded-bakery sm:animate-scale-in max-sm:animate-slide-up">
        <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-espresso/10 bg-proof-cream/95 px-5 py-4 backdrop-blur sm:px-6">
          <div className="min-w-0">
            {eyebrow && (
              <p className="font-mono text-[10px] uppercase tracking-wider text-oven-amber">{eyebrow}</p>
            )}
            {title && (
              <h2 className="mt-0.5 font-display text-xl font-semibold text-espresso sm:text-2xl">{title}</h2>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-espresso/50 hover:bg-espresso/5 hover:text-espresso"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-5 py-5 sm:px-6">{children}</div>
        {footer && (
          <div className="sticky bottom-0 flex justify-end gap-2 border-t border-espresso/10 bg-proof-cream/95 px-5 py-4 backdrop-blur sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

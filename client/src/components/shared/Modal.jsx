import { useEffect } from 'react'
import { X } from 'lucide-react'

const sizeClass = {
  md: 'max-w-lg',
  xl: 'max-w-3xl h-[85vh]',
}

export function Modal({ open, onClose, eyebrow, title, children, footer, size = 'md', bodyClassName }) {
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
      <div className={`relative z-10 flex w-full max-h-[92vh] flex-col overflow-hidden rounded-t-2xl bg-proof-cream shadow-bakery-lg sm:rounded-bakery sm:animate-scale-in max-sm:animate-slide-up ${sizeClass[size]}`}>
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-espresso/10 bg-proof-cream/95 px-5 py-4 backdrop-blur sm:px-6">
          <div className="min-w-0">
            {eyebrow && (
              <p className="font-mono text-[10px] uppercase tracking-wider text-oven-amber">{eyebrow}</p>
            )}
            {title && (
              <h2 className="mt-0.5 truncate font-display text-xl font-semibold text-espresso sm:text-2xl">{title}</h2>
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
        <div className={bodyClassName ?? 'overflow-y-auto px-5 py-5 sm:px-6'}>{children}</div>
        {footer && (
          <div className="flex shrink-0 justify-end gap-2 border-t border-espresso/10 bg-proof-cream/95 px-5 py-4 backdrop-blur sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

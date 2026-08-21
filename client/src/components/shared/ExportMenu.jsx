import { useState } from 'react'
import { Download, FileText, Sheet } from 'lucide-react'
import { useClickOutside } from '@/hooks'

export function ExportMenu({ onExportPDF, onExportExcel }) {
  const [open, setOpen] = useState(false)
  const ref = useClickOutside(open, () => setOpen(false))

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-bakery border border-espresso/15 bg-proof-cream px-3.5 py-2 text-sm font-medium text-espresso transition hover:bg-sourdough/40"
      >
        <Download className="h-4 w-4" />
        Export
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1.5 w-48 overflow-hidden rounded-bakery border border-espresso/10 bg-proof-cream shadow-bakery-lg animate-scale-in">
          <button
            onClick={() => { onExportPDF?.(); setOpen(false) }}
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-espresso hover:bg-sourdough/30"
          >
            <FileText className="h-4 w-4 text-cherry-compote" />
            Export as PDF
          </button>
          <button
            onClick={() => { onExportExcel?.(); setOpen(false) }}
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-espresso hover:bg-sourdough/30"
          >
            <Sheet className="h-4 w-4 text-matcha-glaze" />
            Export as Excel
          </button>
        </div>
      )}
    </div>
  )
}

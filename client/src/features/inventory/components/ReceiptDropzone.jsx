import { Upload } from 'lucide-react'

export function ReceiptDropzone({ value, onChange }) {
  return (
    <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-espresso/20 bg-crust/30 px-4 py-6 text-center transition hover:border-oven-amber hover:bg-oven-amber/5">
      <Upload className="h-5 w-5 text-espresso/40" />
      <span className="text-xs text-espresso/50">{value ? value : 'Drop receipt or click to upload'}</span>
      <input type="file" className="hidden" onChange={(e) => onChange?.(e.target.files?.[0]?.name || '')} />
    </label>
  )
}

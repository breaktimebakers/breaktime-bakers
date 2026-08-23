import { Upload, Camera } from 'lucide-react'

export function ReceiptDropzone({ value, onChange }) {
  const handleFile = (e) => onChange?.(e.target.files?.[0] || null)

  return (
    <div className="flex items-stretch gap-2">
      <label className="flex flex-1 basis-1/2 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-espresso/20 bg-crust/30 px-4 py-6 text-center transition hover:border-oven-amber hover:bg-oven-amber/5">
        <Upload className="h-5 w-5 text-espresso/40" />
        <span className="text-xs text-espresso/50">{value ? value.name : 'Drop receipt or click to upload'}</span>
        <input type="file" accept="application/pdf,image/*" className="hidden" onChange={handleFile} />
      </label>

      {/* accept + capture only steer mobile browsers straight into the
          camera app; a desktop with no camera just falls back to its
          normal file picker, so no device-detection is needed here. */}
      <label
        className="flex flex-1 basis-1/2 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-espresso/20 bg-crust/30 px-4 py-6 text-center transition hover:border-oven-amber hover:bg-oven-amber/5"
        title="Take a photo"
      >
        <Camera className="h-5 w-5 text-espresso/40" />
        <span className="text-xs text-espresso/50">Take a photo</span>
        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
      </label>
    </div>
  )
}

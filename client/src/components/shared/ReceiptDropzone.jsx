import { useState } from 'react'
import { Upload, Camera } from 'lucide-react'
import { CameraCaptureModal } from './CameraCaptureModal'

export function ReceiptDropzone({
  value,
  onChange,
  label = 'Drop receipt or click to upload',
  cameraLabel = 'Take a photo',
  accept = 'application/pdf,image/*',
}) {
  const [cameraOpen, setCameraOpen] = useState(false)
  const handleFile = (e) => onChange?.(e.target.files?.[0] || null)

  return (
    <div className="flex items-stretch gap-2">
      <label className="flex flex-1 basis-1/2 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-espresso/20 bg-crust/30 px-4 py-6 text-center transition hover:border-oven-amber hover:bg-oven-amber/5">
        <Upload className="h-5 w-5 text-espresso/40" />
        <span className="text-xs text-espresso/50">{value ? value.name : label}</span>
        <input type="file" accept={accept} className="hidden" onChange={handleFile} />
      </label>

      <button
        type="button"
        onClick={() => setCameraOpen(true)}
        className="flex flex-1 basis-1/2 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-espresso/20 bg-crust/30 px-4 py-6 text-center transition hover:border-oven-amber hover:bg-oven-amber/5"
        title={cameraLabel}
      >
        <Camera className="h-5 w-5 text-espresso/40" />
        <span className="text-xs text-espresso/50">{cameraLabel}</span>
      </button>

      <CameraCaptureModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={(file) => onChange?.(file)}
        facingMode="environment"
      />
    </div>
  )
}

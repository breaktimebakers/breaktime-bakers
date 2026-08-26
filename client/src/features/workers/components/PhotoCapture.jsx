import { useEffect, useMemo, useRef, useState } from 'react'
import { Upload, Camera, X } from 'lucide-react'
import { CameraCaptureModal } from '@/components/shared'

// `value` is null (no photo / cleared), a File just picked this session
// (not yet uploaded - see uploadWorkerPhoto), or a string URL (the
// worker's existing signed photoUrl, unmodified this session).
export function PhotoCapture({ value, onChange }) {
  const uploadRef = useRef(null)
  const [cameraOpen, setCameraOpen] = useState(false)

  const objectUrl = useMemo(() => (value instanceof File ? URL.createObjectURL(value) : null), [value])
  useEffect(() => () => { if (objectUrl) URL.revokeObjectURL(objectUrl) }, [objectUrl])

  const previewUrl = objectUrl || (typeof value === 'string' ? value : null)

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (file) onChange(file)
  }

  return (
    <div>
      <span className="mb-1.5 block text-xs font-medium text-espresso/70">Photo</span>
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-bakery border border-espresso/15 bg-crust/40">
          {previewUrl ? (
            <img src={previewUrl} alt="Worker" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs text-espresso/30">No photo</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => uploadRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-espresso/15 bg-crust/40 px-3 py-1.5 text-xs font-medium text-espresso hover:bg-sourdough/30"
          >
            <Upload className="h-3.5 w-3.5" /> Upload photo
          </button>
          <button
            type="button"
            onClick={() => setCameraOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-espresso/15 bg-crust/40 px-3 py-1.5 text-xs font-medium text-espresso hover:bg-sourdough/30"
          >
            <Camera className="h-3.5 w-3.5" /> Take photo
          </button>
        </div>
        {previewUrl && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-cherry-compote hover:bg-cherry-compote/10"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <input ref={uploadRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <CameraCaptureModal open={cameraOpen} onClose={() => setCameraOpen(false)} onCapture={onChange} facingMode="environment" />
    </div>
  )
}

export function WorkerAvatar({ photo, name, size = 'md' }) {
  const sizes = { sm: 'h-9 w-9 text-xs', md: 'h-12 w-12 text-sm', lg: 'h-20 w-20 text-xl' }
  const cls = sizes[size] || sizes.md
  if (photo) {
    return <img src={photo} alt={name} className={`${cls} rounded-full object-cover`} />
  }
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2)
  return (
    <div className={`flex ${cls} items-center justify-center rounded-full bg-oven-amber/15 font-mono font-semibold text-oven-amber`}>
      {initials}
    </div>
  )
}

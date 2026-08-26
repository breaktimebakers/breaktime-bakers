import { useEffect, useMemo, useRef, useState } from 'react'
import { RotateCcw, Camera as CameraIcon, AlertCircle } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'

// Live in-browser camera capture via getUserMedia - used wherever a
// "Take photo" action needs an actual camera preview. <input capture>
// only triggers the OS camera app on mobile; on desktop it's a no-op
// that falls back to the plain file picker, making it indistinguishable
// from "Upload". This works the same everywhere getUserMedia is
// supported (falls back to an error message + Upload otherwise).
export function CameraCaptureModal({ open, onClose, onCapture, facingMode = 'user' }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [error, setError] = useState('')
  const [photoBlob, setPhotoBlob] = useState(null)

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }

  useEffect(() => {
    if (!open) return

    let cancelled = false
    setError('')
    setPhotoBlob(null)

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera access is not supported in this browser. Use Upload instead.')
      return undefined
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      })
      .catch(() => setError('Could not access the camera. Check browser permissions, or use Upload instead.'))

    return () => {
      cancelled = true
      stopStream()
    }
  }, [open, facingMode])

  const previewUrl = useMemo(() => (photoBlob ? URL.createObjectURL(photoBlob) : null), [photoBlob])
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }, [previewUrl])

  const handleClose = () => {
    stopStream()
    onClose()
  }

  const capture = () => {
    const video = videoRef.current
    if (!video || !video.videoWidth) return

    // Draws the video's true (unmirrored) frame - only the preview is
    // CSS-mirrored below for a natural selfie feel while framing the shot.
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    canvas.toBlob((blob) => { if (blob) setPhotoBlob(blob) }, 'image/jpeg', 0.9)
  }

  const retake = () => setPhotoBlob(null)

  const usePhoto = () => {
    if (!photoBlob) return
    onCapture(new File([photoBlob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' }))
    stopStream()
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      eyebrow="Camera"
      title="Take photo"
      size="xl"
      bodyClassName="flex min-h-0 flex-1 items-center justify-center bg-espresso/5"
      footer={
        error ? (
          <Button variant="secondary" onClick={handleClose}>Close</Button>
        ) : photoBlob ? (
          <>
            <Button variant="secondary" onClick={retake}><RotateCcw className="h-4 w-4" /> Retake</Button>
            <Button onClick={usePhoto}>Use photo</Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={handleClose}>Cancel</Button>
            <Button onClick={capture}><CameraIcon className="h-4 w-4" /> Capture</Button>
          </>
        )
      }
    >
      {error ? (
        <div className="flex flex-col items-center gap-2 p-8 text-center text-espresso/60">
          <AlertCircle className="h-8 w-8 text-cherry-compote" />
          <p className="text-sm">{error}</p>
        </div>
      ) : photoBlob ? (
        <img src={previewUrl} alt="Captured" className="max-h-full max-w-full object-contain" />
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`max-h-full max-w-full ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
        />
      )}
    </Modal>
  )
}

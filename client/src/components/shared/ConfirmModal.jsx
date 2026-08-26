import { AlertTriangle } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'

// Generic yes/no gate for a destructive (or otherwise consequential)
// action - the caller owns the actual mutation and just tells this
// component whether it's mid-flight via isLoading, so Confirm can't be
// double-clicked into firing twice.
export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  tone = 'danger',
  isLoading = false,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>{cancelLabel}</Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Please wait…' : confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        {tone === 'danger' && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cherry-compote/10 text-cherry-compote">
            <AlertTriangle className="h-5 w-5" />
          </div>
        )}
        {description && <p className="pt-2 text-sm leading-relaxed text-espresso/70">{description}</p>}
      </div>
    </Modal>
  )
}

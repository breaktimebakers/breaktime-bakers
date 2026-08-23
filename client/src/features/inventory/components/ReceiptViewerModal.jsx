import { FileWarning } from 'lucide-react'
import { Modal } from '@/components/shared'

// receiptUrl is a short-lived (15 min) signed R2 read URL - see
// createReadUrl in server/src/utils/objectStorage.js. It's generated
// fresh on every lots fetch, so as long as this modal is opened from
// data that just came off the network (not something cached from a
// while ago), the link is good for the life of the viewing session.
export function ReceiptViewerModal({ open, onClose, receiptUrl, title }) {
  return (
    <Modal open={open} onClose={onClose} eyebrow="Purchase receipt" title={title} size="xl" bodyClassName="min-h-0 flex-1 bg-espresso/5">
      {receiptUrl ? (
        <iframe src={receiptUrl} title={title || 'Receipt'} className="h-full w-full border-0" />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-espresso/40">
          <FileWarning className="h-8 w-8" />
          <p className="text-sm">No receipt available for this lot.</p>
        </div>
      )}
    </Modal>
  )
}

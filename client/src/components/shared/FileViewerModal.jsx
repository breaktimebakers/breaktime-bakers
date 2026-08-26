import { FileWarning } from 'lucide-react'
import { Modal } from './Modal'

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp']

// The object key preserves the original filename's extension (see
// buildObjectKey in server/src/utils/objectStorage.js), so the signed
// URL's path still ends in .jpg/.png/etc - strip the query string first
// since that's where the signing params live, not the path.
const isImageUrl = (url) => {
  const path = url.split('?')[0]
  const ext = path.split('.').pop()?.toLowerCase()
  return IMAGE_EXTENSIONS.includes(ext)
}

// fileUrl is a short-lived (15 min) signed R2 read URL - see createReadUrl
// in server/src/utils/objectStorage.js. It's generated fresh on every
// fetch, so as long as this modal is opened from data that just came off
// the network (not something cached from a while ago), the link is good
// for the life of the viewing session.
export function FileViewerModal({ open, onClose, fileUrl, title, eyebrow = 'Attachment', emptyLabel = 'No file available.' }) {
  return (
    <Modal open={open} onClose={onClose} eyebrow={eyebrow} title={title} size="xl" bodyClassName="min-h-0 flex-1 bg-espresso/5">
      {fileUrl ? (
        isImageUrl(fileUrl) ? (
          <div className="flex h-full items-center justify-center overflow-auto p-4">
            <img src={fileUrl} alt={title || 'Attachment'} className="max-h-full max-w-full object-contain" />
          </div>
        ) : (
          <iframe src={fileUrl} title={title || 'Attachment'} className="h-full w-full border-0" />
        )
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-espresso/40">
          <FileWarning className="h-8 w-8" />
          <p className="text-sm">{emptyLabel}</p>
        </div>
      )}
    </Modal>
  )
}

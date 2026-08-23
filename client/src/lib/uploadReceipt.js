import { apiClient } from './apiClient'
import { ENDPOINTS } from '@/constants/ENDPOINTS'

// Backend only whitelists this one destination today (see
// upload.validation.js ALLOWED_FOLDERS) - hardcoded rather than passed
// in until a second upload surface actually needs a different folder.
const RECEIPT_FOLDER = 'receipts/raw-materials'

// Two-step upload: ask our API for a short-lived presigned PUT url (this
// goes through apiClient, so it's authenticated/authorized), then PUT the
// file straight to object storage - that leg is a plain fetch, not
// apiClient, since it targets a different host and must send the raw
// file body rather than JSON, and must not carry our auth cookies.
export async function uploadReceipt(file) {
  const contentType = file.type || 'application/octet-stream'

  const { key, uploadUrl } = await apiClient.post(ENDPOINTS.uploads.receiptUrl, {
    folder: RECEIPT_FOLDER,
    fileName: file.name,
    contentType,
  })

  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: file,
  })

  if (!res.ok) {
    throw new Error('Receipt upload failed. Please try again.')
  }

  return key
}

import { apiClient } from './apiClient'
import { ENDPOINTS } from '@/constants/ENDPOINTS'

// Same generic presigned-upload endpoint as the other upload*.js helpers,
// just a different whitelisted folder (see server/src/modules/uploads/upload.validation.js).
const BILL_FOLDER = 'receipts/taxes'

export async function uploadTaxBill(file) {
  const contentType = file.type || 'application/octet-stream'

  const { key, uploadUrl } = await apiClient.post(ENDPOINTS.uploads.receiptUrl, {
    folder: BILL_FOLDER,
    fileName: file.name,
    contentType,
  })

  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: file,
  })

  if (!res.ok) {
    throw new Error('Bill upload failed. Please try again.')
  }

  return key
}

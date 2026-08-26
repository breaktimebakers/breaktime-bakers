import { apiClient } from './apiClient'
import { ENDPOINTS } from '@/constants/ENDPOINTS'

// Same generic presigned-upload endpoint as uploadReceipt.js, just a
// different whitelisted folder (see server/src/modules/uploads/upload.validation.js).
const PHOTO_FOLDER = 'photos/workers'

export async function uploadWorkerPhoto(file) {
  const contentType = file.type || 'application/octet-stream'

  const { key, uploadUrl } = await apiClient.post(ENDPOINTS.uploads.receiptUrl, {
    folder: PHOTO_FOLDER,
    fileName: file.name,
    contentType,
  })

  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: file,
  })

  if (!res.ok) {
    throw new Error('Photo upload failed. Please try again.')
  }

  return key
}

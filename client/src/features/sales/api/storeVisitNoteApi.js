import { apiClient } from '@/lib/apiClient'
import { ENDPOINTS } from '@/constants/ENDPOINTS'

export const storeVisitNoteApi = {
  list: (query) => apiClient.get(ENDPOINTS.storeVisitNotes.list, { query }),
  create: (body) => apiClient.post(ENDPOINTS.storeVisitNotes.create, body),
}

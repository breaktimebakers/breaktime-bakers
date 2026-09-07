import { apiClient } from '@/lib/apiClient'
import { ENDPOINTS } from '@/constants/ENDPOINTS'

export const rawMaterialApi = {
  list: (query) => apiClient.get(ENDPOINTS.rawMaterials.list, { query }),
  create: (body) => apiClient.post(ENDPOINTS.rawMaterials.create, body),
  update: (id, body) => apiClient.patch(ENDPOINTS.rawMaterials.update(id), body),
  remove: (id) => apiClient.delete(ENDPOINTS.rawMaterials.remove(id)),
  lots: (id, query) => apiClient.get(ENDPOINTS.rawMaterials.lots(id), { query }),
  createLot: (id, body) => apiClient.post(ENDPOINTS.rawMaterials.createLot(id), body),
  markWastage: (id, lotId, body) => apiClient.post(ENDPOINTS.rawMaterials.markWastage(id, lotId), body),
  allLots: (query) => apiClient.get(ENDPOINTS.rawMaterials.allLots, { query }),
  updateLotPayment: (lotId, body) => apiClient.patch(ENDPOINTS.rawMaterials.updateLotPayment(lotId), body),
}

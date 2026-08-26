import { apiClient } from "@/lib/apiClient";
import { ENDPOINTS } from "@/constants/ENDPOINTS";

export const areaApi = {
  list: () => apiClient.get(ENDPOINTS.areas.list),
  detail: (id) => apiClient.get(ENDPOINTS.areas.detail(id)),
  create: (body) => apiClient.post(ENDPOINTS.areas.create, body),
  update: (id, body) => apiClient.patch(ENDPOINTS.areas.update(id), body),
  stores: (id) => apiClient.get(ENDPOINTS.areas.stores(id)),
  createStore: (id, body) =>
    apiClient.post(ENDPOINTS.areas.createStore(id), body),
};

export const storeApi = {
  list: () => apiClient.get(ENDPOINTS.stores.list),
  update: (id, body) => apiClient.patch(ENDPOINTS.stores.update(id), body),
  updateStatus: (id, isActive) =>
    apiClient.patch(ENDPOINTS.stores.updateStatus(id), { isActive }),
};

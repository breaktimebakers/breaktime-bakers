import { apiClient } from "@/lib/apiClient";
import { ENDPOINTS } from "@/constants/ENDPOINTS";

export const authApi = {
  me: () => apiClient.get(ENDPOINTS.auth.me),
  login: (credentials) => apiClient.post(ENDPOINTS.auth.login, credentials),
  logout: () => apiClient.post(ENDPOINTS.auth.logout),
  register: (data) => apiClient.post(ENDPOINTS.auth.register, data),
};

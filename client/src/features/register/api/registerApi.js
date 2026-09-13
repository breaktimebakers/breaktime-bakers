import { apiClient } from "@/lib/apiClient";
import { ENDPOINTS } from "@/constants/ENDPOINTS";

export const registerApi = {
  createAdmin: (data) => apiClient.post(ENDPOINTS.auth.register, data),
};

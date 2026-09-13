import { apiClient } from "@/lib/apiClient";
import { ENDPOINTS } from "@/constants/ENDPOINTS";

export const registerApi = {
  createAdmin: (data) => apiClient.post(ENDPOINTS.auth.register, data),
  listAdmins: () => apiClient.get(ENDPOINTS.admins.list),
  deleteAdmin: (id) => apiClient.delete(ENDPOINTS.admins.remove(id)),
  changeAdminPassword: (id, password) => apiClient.patch(ENDPOINTS.admins.changePassword(id), { password }),
};

import { sendResponse } from "../../utils/apiResponse.js";
import * as userService from "./user.service.js";

export const list = async (req, res) => {
  const result = await userService.listAdmins();

  sendResponse(res, 200, "Admins fetched", result);
};

export const remove = async (req, res) => {
  await userService.deleteAdmin(req.user.userId, req.params.id);

  sendResponse(res, 200, "Admin deleted", null);
};

export const changePassword = async (req, res) => {
  await userService.changeAdminPassword(req.params.id, req.body.password);

  sendResponse(res, 200, "Password updated", null);
};

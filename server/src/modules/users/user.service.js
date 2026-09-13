import bcrypt from "bcrypt";
import { httpError } from "../../utils/httpError.js";
import { revokeAllSessionsForUser } from "../sessions/session.repository.js";
import * as userRepo from "./user.repository.js";

export const listAdmins = async () => {
  const admins = await userRepo.listAdminUsers();
  return { admins };
};

// Self-deletion is blocked here rather than just hidden client-side - the
// UI disables the action for your own row, but this is the actual gate.
export const deleteAdmin = async (currentUserId, targetId) => {
  if (currentUserId === targetId) {
    throw httpError(400, "You cannot delete your own account", "CANNOT_DELETE_SELF");
  }

  const deleted = await userRepo.deleteUserById(targetId);

  if (!deleted) {
    throw httpError(404, "Admin not found");
  }
};

// A changed password doesn't invalidate sessions on its own (they're keyed
// by session id, not the password), so revoke every session for this user -
// same "force re-authentication" posture as refresh-token reuse handling in
// auth.service.js - otherwise a device already logged in stays logged in
// under the old password indefinitely.
export const changeAdminPassword = async (id, password) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const updated = await userRepo.updateUserPassword(id, hashedPassword);

  if (!updated) {
    throw httpError(404, "Admin not found");
  }

  await revokeAllSessionsForUser(id);
};

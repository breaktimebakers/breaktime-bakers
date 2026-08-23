import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { findUserById } from "../modules/users/user.repository.js";

export const requireAuth = async (req, res, next) => {
  const accessToken = req.cookies?.accessToken;

  if (!accessToken) {
    res.status(401).json({
      success: false,
      code: "ACCESS_TOKEN_MISSING",
      message: "Access token missing",
    });
    return;
  }

  let payload;

  try {
    payload = jwt.verify(accessToken, env.JWT_ACCESS_SECRET);
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        code: "ACCESS_TOKEN_EXPIRED",
        message: "Access token expired",
      });
      return;
    }

    res.status(401).json({
      success: false,
      code: "INVALID_ACCESS_TOKEN",
      message: "Invalid access token",
    });
    return;
  }

  if (!payload.userId) {
    res.status(401).json({
      success: false,
      code: "INVALID_TOKEN_PAYLOAD",
      message: "Invalid token payload",
    });
    return;
  }

  // Looked up fresh on every request rather than trusting a role baked
  // into the (up to 15-minute-lived) access token, so a role change or
  // account deletion - made by this codebase or the shared-DB one - takes
  // effect on the very next request instead of waiting for token expiry.
  // Left to reject naturally on a genuine DB failure - Express 5 forwards
  // a rejected async middleware to the error handler (500), rather than
  // that failure being mislabeled as an auth problem (401).
  const user = await findUserById(payload.userId);

  if (!user) {
    res.status(401).json({
      success: false,
      code: "USER_NOT_FOUND",
      message: "Account no longer exists",
    });
    return;
  }

  req.user = { userId: user.id, role: user.role };

  next();
};

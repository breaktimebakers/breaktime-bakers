import { sendResponse } from "../../utils/apiResponse.js";
import { setAuthCookies } from "../../utils/set-auth-cookies.js";
import { baseCookieOptions } from "../../utils/cookieOptions.js";
import * as authService from "./auth.service.js";

const clearAuthCookies = (res) => {
  res.clearCookie("accessToken", baseCookieOptions);
  res.clearCookie("refreshToken", baseCookieOptions);
};

const requestMeta = (req) => ({
  userAgent: req.headers["user-agent"]?.slice(0, 255) ?? null,
  ipAddress: req.ip ?? null,
});

export const register = async (req, res) => {
  const result = await authService.registerUser(req.body, requestMeta(req));

  setAuthCookies(res, result.accessToken, result.refreshToken);

  sendResponse(res, 201, "User registered successfully!", { user: result.user });
};

export const login = async (req, res) => {
  const result = await authService.loginUser(req.body, requestMeta(req));

  setAuthCookies(res, result.accessToken, result.refreshToken);

  sendResponse(res, 200, "Logged in successfully!", { user: result.user });
};

export const logout = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (refreshToken) {
    await authService.logoutUser(refreshToken);
  }

  clearAuthCookies(res);

  sendResponse(res, 200, "Logged out successfully", null);
};

export const rotateToken = async (req, res) => {
  const oldRefreshToken = req.cookies?.refreshToken;

  let result;
  try {
    result = await authService.rotateRefreshToken(oldRefreshToken);
  } catch (error) {
    if (error.code === "REFRESH_TOKEN_REUSED") {
      clearAuthCookies(res);
    }
    throw error;
  }

  setAuthCookies(res, result.accessToken, result.refreshToken);

  sendResponse(res, 200, "Token refreshed successfully", null);
};

export const getCurrentUser = async (req, res) => {
  const result = await authService.getCurrentUser(req.user.userId);

  sendResponse(res, 200, "Current user fetched", { user: result });
};

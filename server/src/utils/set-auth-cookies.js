import { accessTokenCookieOptions, refreshTokenCookieOptions } from "./cookieOptions.js";

export const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, accessTokenCookieOptions);
  res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);
};

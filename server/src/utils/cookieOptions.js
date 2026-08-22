const isProduction = process.env.NODE_ENV === "production";

// Anything that identifies *which* cookie this is to the browser (path,
// httpOnly, secure, sameSite) must match exactly between res.cookie() and
// res.clearCookie(), or the browser will silently keep the old one instead
// of clearing it. maxAge is the only thing that's allowed to differ.
export const baseCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "strict",
  path: "/",
};

export const accessTokenCookieOptions = {
  ...baseCookieOptions,
  maxAge: 15 * 60 * 1000,
};

export const refreshTokenCookieOptions = {
  ...baseCookieOptions,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

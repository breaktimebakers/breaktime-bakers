import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v7 as uuidv7 } from "uuid";
import { env } from "../../config/env.js";
import { httpError } from "../../utils/httpError.js";
import { hashToken } from "../../utils/hashToken.js";
import { createUser, findUserByEmail, findUserById } from "../users/user.repository.js";
import {
  createSession,
  findActiveSessionById,
  revokeAllSessionsForUser,
  revokeSession,
  rotateSessionToken,
} from "../sessions/session.repository.js";

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const issueTokenPair = (userId, sessionId) => {
  const accessToken = jwt.sign({ userId }, env.JWT_ACCESS_SECRET, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign({ userId, sessionId }, env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
};

// Starts a brand new session (login/register): fresh session id, fresh token.
const startSession = async (userId, meta) => {
  const sessionId = uuidv7();
  const { accessToken, refreshToken } = issueTokenPair(userId, sessionId);

  await createSession({
    id: sessionId,
    userId,
    tokenHash: hashToken(refreshToken),
    userAgent: meta?.userAgent ?? null,
    ipAddress: meta?.ipAddress ?? null,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  });

  return { accessToken, refreshToken };
};

export const registerUser = async (body, meta) => {
  const existingUser = await findUserByEmail(body.email);

  if (existingUser) {
    throw httpError(409, "User already exists");
  }

  const hashedPassword = await bcrypt.hash(body.password, 10);
  const userId = uuidv7();

  const user = await createUser({
    id: userId,
    name: body.name,
    email: body.email,
    password: hashedPassword,
  });

  const { accessToken, refreshToken } = await startSession(userId, meta);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    accessToken,
    refreshToken,
  };
};

export const loginUser = async (body, meta) => {
  const existingUser = await findUserByEmail(body.email);

  if (!existingUser) {
    throw httpError(400, "Invalid email or password");
  }

  const isValidPassword = await bcrypt.compare(body.password, existingUser.password);

  if (!isValidPassword) {
    throw httpError(400, "Invalid email or password");
  }

  const { accessToken, refreshToken } = await startSession(existingUser.id, meta);

  return {
    user: {
      id: existingUser.id,
      name: existingUser.name,
      email: existingUser.email,
    },
    accessToken,
    refreshToken,
  };
};

export const logoutUser = async (refreshToken) => {
  let payload;

  try {
    payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET, {
      ignoreExpiration: true,
    });
  } catch {
    return;
  }

  if (!payload.sessionId) {
    return;
  }

  await revokeSession(payload.sessionId);
};

export const rotateRefreshToken = async (oldRefreshToken) => {
  if (!oldRefreshToken) {
    throw httpError(401, "Refresh token missing", "REFRESH_TOKEN_MISSING");
  }

  let payload;

  try {
    payload = jwt.verify(oldRefreshToken, env.JWT_REFRESH_SECRET);
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      // The signature was valid (jsonwebtoken checks that before expiry), so
      // this genuinely came from us — safe to use its payload to clean up
      // the now-dead session instead of leaving it sitting in the DB.
      const decoded = jwt.decode(oldRefreshToken);
      if (decoded?.sessionId) {
        await revokeSession(decoded.sessionId);
      }
      throw httpError(401, "Refresh token expired", "REFRESH_TOKEN_EXPIRED");
    }
    throw httpError(401, "Invalid refresh token", "INVALID_REFRESH_TOKEN");
  }

  const { userId, sessionId } = payload;

  if (!userId || !sessionId) {
    throw httpError(401, "Invalid refresh token", "INVALID_REFRESH_TOKEN");
  }

  const session = await findActiveSessionById(sessionId);

  if (!session) {
    throw httpError(401, "Invalid refresh token", "INVALID_REFRESH_TOKEN");
  }

  // Belt-and-suspenders: the JWT's own exp claim already matches this, but
  // guard the DB record too and revoke it so it doesn't linger as "active".
  if (session.expiresAt.getTime() < Date.now()) {
    await revokeSession(sessionId);
    throw httpError(401, "Refresh token expired", "REFRESH_TOKEN_EXPIRED");
  }

  // The token presented isn't the one currently on file for this session,
  // meaning it was already rotated away and is being replayed — either the
  // real user's browser retried a stale token, or someone stole an earlier
  // token in the chain. Treat it as theft: kill every session this user has.
  if (hashToken(oldRefreshToken) !== session.tokenHash) {
    await revokeAllSessionsForUser(userId);
    throw httpError(
      401,
      "Refresh token reuse detected. All sessions have been revoked, please log in again.",
      "REFRESH_TOKEN_REUSED",
    );
  }

  const { accessToken, refreshToken } = issueTokenPair(userId, sessionId);

  await rotateSessionToken(sessionId, {
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  });

  return { accessToken, refreshToken };
};

export const getCurrentUser = async (userId) => {
  const user = await findUserById(userId);

  if (!user) {
    throw httpError(404, "User not found");
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
};

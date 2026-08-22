import { and, eq, isNull } from "drizzle-orm";
import { db } from "../../db/index.js";
import { sessions } from "./session.schema.js";

export const createSession = async (data) => {
  const result = await db.insert(sessions).values(data).returning();
  return result[0];
};

export const findActiveSessionById = async (id) => {
  const result = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, id), isNull(sessions.revokedAt)));
  return result[0];
};

export const rotateSessionToken = async (id, { tokenHash, expiresAt }) => {
  await db
    .update(sessions)
    .set({ tokenHash, expiresAt, lastUsedAt: new Date() })
    .where(eq(sessions.id, id));
};

export const revokeSession = async (id) => {
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(eq(sessions.id, id));
};

export const revokeAllSessionsForUser = async (userId) => {
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
};

import { pgTable, varchar, timestamp } from "drizzle-orm/pg-core";
import { users } from "../users/user.schema.js";

export const sessions = pgTable("sessions", {
  id: varchar("id", { length: 36 }).primaryKey(),

  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  // Hash of the refresh token that is currently valid for this session.
  // Rotates on every successful refresh.
  tokenHash: varchar("token_hash", { length: 64 }).notNull(),

  userAgent: varchar("user_agent", { length: 255 }),

  ipAddress: varchar("ip_address", { length: 45 }),

  expiresAt: timestamp("expires_at").notNull(),

  revokedAt: timestamp("revoked_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),

  lastUsedAt: timestamp("last_used_at").defaultNow().notNull(),
});

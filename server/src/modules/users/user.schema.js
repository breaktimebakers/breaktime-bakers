import { pgTable, varchar, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),

  name: varchar("name", { length: 100 }).notNull(),

  email: varchar("email", { length: 255 }).notNull().unique(),

  password: varchar("password", { length: 255 }).notNull(),

  // Plain varchar, not a pg enum: this DB is shared with other, separately
  // deployed codebases (e.g. a future staff app) that may need to introduce
  // their own role values without coordinating a migration through this
  // codebase. This app only ever grants access to the "admin" role - see
  // requireRole in middlewares/requireRole.js.
  role: varchar("role", { length: 30 }).notNull().default("admin"),

  createdAt: timestamp("created_at").defaultNow().notNull(),

  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

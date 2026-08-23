import { pgTable, varchar, timestamp } from "drizzle-orm/pg-core";

export const vendors = pgTable("vendors", {
  id: varchar("id", { length: 36 }).primaryKey(),

  name: varchar("name", { length: 150 }).notNull().unique(),

  phone: varchar("phone", { length: 20 }),

  createdAt: timestamp("created_at").defaultNow().notNull(),

  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

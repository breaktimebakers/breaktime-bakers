import { pgTable, varchar, numeric, timestamp } from "drizzle-orm/pg-core";

export const products = pgTable("products", {
  id: varchar("id", { length: 36 }).primaryKey(),

  name: varchar("name", { length: 150 }).notNull().unique(),

  unit: varchar("unit", { length: 20 }).notNull(),

  // Last known selling price - refreshed whenever a batch supplies one,
  // left untouched otherwise. No manual product CRUD exists; this table
  // is only ever written to as a side effect of logging a batch.
  pricePerUnit: numeric("price_per_unit", { precision: 12, scale: 2, mode: "number" }),

  createdAt: timestamp("created_at").defaultNow().notNull(),

  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

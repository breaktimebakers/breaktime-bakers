import { pgTable, varchar, numeric, timestamp } from "drizzle-orm/pg-core";

export const batches = pgTable("batches", {
  id: varchar("id", { length: 36 }).primaryKey(),

  // Plain text for now - no products table yet.
  productName: varchar("product_name", { length: 150 }).notNull(),

  quantityProduced: numeric("quantity_produced", { precision: 12, scale: 3, mode: "number" }).notNull(),

  unit: varchar("unit", { length: 20 }).notNull(),

  // Seeds the Ready Stock price when this batch lands there - out of
  // scope for this pass, kept nullable.
  pricePerUnit: numeric("price_per_unit", { precision: 12, scale: 2, mode: "number" }),

  producedAt: timestamp("produced_at").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

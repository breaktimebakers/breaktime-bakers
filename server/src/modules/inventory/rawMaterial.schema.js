import { pgTable, varchar, numeric, boolean, timestamp } from "drizzle-orm/pg-core";

export const rawMaterials = pgTable("raw_materials", {
  id: varchar("id", { length: 36 }).primaryKey(),

  name: varchar("name", { length: 100 }).notNull().unique(),

  unit: varchar("unit", { length: 20 }).notNull(),

  lowStockAt: numeric("low_stock_at", { precision: 12, scale: 3, mode: "number" })
    .notNull()
    .default(0),

  // "Delete" in the UI sets this instead of removing the row - a material
  // with purchase/consumption history can't be hard-deleted without
  // breaking that history.
  isArchived: boolean("is_archived").notNull().default(false),

  createdAt: timestamp("created_at").defaultNow().notNull(),

  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

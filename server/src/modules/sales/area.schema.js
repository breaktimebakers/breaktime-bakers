import { pgTable, varchar, boolean, timestamp } from "drizzle-orm/pg-core";

export const areas = pgTable("areas", {
  id: varchar("id", { length: 36 }).primaryKey(),

  name: varchar("name", { length: 150 }).notNull().unique(),

  // Free text, not its own table - every seed area is Mumbai today, and
  // normalizing this only earns its cost once a second city carries real
  // city-level data (tax jurisdiction, delivery zones, ...).
  city: varchar("city", { length: 100 }).notNull(),

  pincode: varchar("pincode", { length: 10 }).notNull(),

  // Hide-from-list soft delete - not exposed in the UI as a status, just
  // the same "don't hard-delete a row other tables reference" pattern
  // used elsewhere. Stores get their own separate isActive for the
  // business-status concept.
  isArchived: boolean("is_archived").notNull().default(false),

  createdAt: timestamp("created_at").defaultNow().notNull(),

  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

import { pgTable, varchar, numeric, date, timestamp, index } from "drizzle-orm/pg-core";

export const expenses = pgTable(
  "expenses",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    // Free varchar, not a pg enum - validated against the fixed category
    // list at the Zod layer (see expense.validation.js), matching how
    // storeType/worker role are handled, so a new category never needs a
    // migration.
    category: varchar("category", { length: 50 }).notNull(),

    amount: numeric("amount", { precision: 12, scale: 2, mode: "number" }).notNull(),

    date: date("date", { mode: "string" }).notNull(),

    note: varchar("note", { length: 500 }),

    // R2 object key, not a URL - same private-bucket pattern as a worker's
    // photoKey. Resolved to a signed URL at request time. No create-only
    // vs update-later nuance to worry about here (unlike worker photos) -
    // expenses are add + delete only, never edited.
    billKey: varchar("bill_key", { length: 500 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),

    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    // The only real query here is "expenses in this date range" (the
    // Today/Week/Month/All filter on the Expenses page).
    dateIdx: index("expenses_date_idx").on(table.date),
  }),
);

import { pgTable, varchar, numeric, date, timestamp, index } from "drizzle-orm/pg-core";

export const taxEntries = pgTable(
  "tax_entries",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    amount: numeric("amount", { precision: 12, scale: 2, mode: "number" }).notNull(),

    date: date("date", { mode: "string" }).notNull(),

    note: varchar("note", { length: 500 }),

    // R2 object key, not a URL - same private-bucket pattern as an
    // expense's billKey. Resolved to a signed URL at request time. Add +
    // delete only, never edited, so no omitted-vs-null update nuance here.
    billKey: varchar("bill_key", { length: 500 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),

    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    // The Taxes page filters by month.
    dateIdx: index("tax_entries_date_idx").on(table.date),
  }),
);

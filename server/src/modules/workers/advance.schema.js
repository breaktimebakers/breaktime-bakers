import { pgTable, varchar, numeric, date, timestamp, index } from "drizzle-orm/pg-core";
import { workers } from "./worker.schema.js";

// A cash advance given to a worker mid-month, deducted from that month's
// computed salary on the Finance Salary page. Add + delete only, never
// edited - same ledger pattern as expenses.
export const workerAdvances = pgTable(
  "worker_advances",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    workerId: varchar("worker_id", { length: 36 })
      .notNull()
      .references(() => workers.id, { onDelete: "cascade" }),

    date: date("date", { mode: "string" }).notNull(),

    amount: numeric("amount", { precision: 12, scale: 2, mode: "number" }).notNull(),

    note: varchar("note", { length: 500 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),

    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    workerIdIdx: index("worker_advances_worker_id_idx").on(table.workerId),
  }),
);

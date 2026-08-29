import { pgTable, varchar, integer, numeric, date, timestamp, index, unique } from "drizzle-orm/pg-core";
import { workers } from "./worker.schema.js";

// One row = that worker's salary for that (year, month) has been paid out.
// No row = unpaid, and it stays counted as owed in the Finance Salary
// page's running "Unpaid" total for every month after it too - that's the
// entire rollover mechanism, no separate carry-forward step needed.
// Marking a month unpaid again is a delete, not a status flip.
export const workerSalaryPayments = pgTable(
  "worker_salary_payments",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    workerId: varchar("worker_id", { length: 36 })
      .notNull()
      .references(() => workers.id, { onDelete: "cascade" }),

    // 0-11, matching the JS Date#getMonth() convention already used
    // throughout the client's payroll calc (salary.js, useFinance.js).
    year: integer("year").notNull(),
    month: integer("month").notNull(),

    // Snapshot of what was paid at the moment this was marked paid, so a
    // later attendance edit doesn't silently rewrite settled history.
    amountPaid: numeric("amount_paid", { precision: 12, scale: 2, mode: "number" }).notNull(),

    paidDate: date("paid_date", { mode: "string" }).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    workerMonthUnique: unique("worker_salary_payments_worker_id_year_month_key").on(
      table.workerId,
      table.year,
      table.month,
    ),
    workerIdIdx: index("worker_salary_payments_worker_id_idx").on(table.workerId),
  }),
);

import { pgTable, varchar, date, numeric, timestamp, index, unique } from "drizzle-orm/pg-core";
import { workers } from "./worker.schema.js";

export const workerAttendance = pgTable(
  "worker_attendance",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    workerId: varchar("worker_id", { length: 36 })
      .notNull()
      .references(() => workers.id, { onDelete: "cascade" }),

    date: date("date", { mode: "string" }).notNull(),

    // "present" / "absent" / "half_day" - see workers.status comment
    // re: free varchar over a pg enum.
    status: varchar("status", { length: 20 }).notNull(),

    overtimeHours: numeric("overtime_hours", { precision: 5, scale: 2, mode: "number" }).notNull().default(0),

    createdAt: timestamp("created_at").defaultNow().notNull(),

    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    // One entry per worker per day - marking attendance again for the
    // same day updates this row rather than inserting a new one.
    workerDateUnique: unique("worker_attendance_worker_id_date_key").on(table.workerId, table.date),
    workerIdIdx: index("worker_attendance_worker_id_idx").on(table.workerId),
  }),
);

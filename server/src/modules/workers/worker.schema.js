import { pgTable, varchar, numeric, date, timestamp, index } from "drizzle-orm/pg-core";

export const workers = pgTable(
  "workers",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    name: varchar("name", { length: 100 }).notNull(),

    address: varchar("address", { length: 500 }),

    phone: varchar("phone", { length: 20 }),

    aadhaarNumber: varchar("aadhaar_number", { length: 20 }),

    // R2 object key, not a URL - same private-bucket pattern as a
    // material lot's receiptKey. Resolved to a signed URL at request time.
    photoKey: varchar("photo_key", { length: 500 }),

    joiningDate: date("joining_date", { mode: "string" }).notNull(),

    // Null while the worker is still employed.
    leftDate: date("left_date", { mode: "string" }),

    // "active" / "left" - business status, not a soft-delete flag. A left
    // worker's rows stay in place for salary/attendance history.
    status: varchar("status", { length: 20 }).notNull().default("active"),

    monthlySalary: numeric("monthly_salary", { precision: 12, scale: 2, mode: "number" }).notNull(),

    overtimeRate: numeric("overtime_rate", { precision: 12, scale: 2, mode: "number" }).notNull().default(0),

    // "HH:MM" - free text, not a DB time type, matching how the frontend
    // already reads/writes these.
    shiftStart: varchar("shift_start", { length: 5 }).notNull(),
    shiftEnd: varchar("shift_end", { length: 5 }).notNull(),

    weekOffDay: varchar("week_off_day", { length: 10 }).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),

    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    statusIdx: index("workers_status_idx").on(table.status),
  }),
);

import { pgTable, varchar, date, timestamp, index, unique } from "drizzle-orm/pg-core";
import { workers } from "./worker.schema.js";
import { areas } from "../sales/area.schema.js";

// Daily area assignments. The legacy table/export names are retained to
// preserve existing dated rows without a database migration. Null or no row
// means unassigned; recurring weekly routes are no longer used.
export const workerAreaOverride = pgTable(
  "worker_area_override",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    workerId: varchar("worker_id", { length: 36 })
      .notNull()
      .references(() => workers.id, { onDelete: "cascade" }),

    date: date("date", { mode: "string" }).notNull(),

    areaId: varchar("area_id", { length: 36 }).references(() => areas.id),

    createdAt: timestamp("created_at").defaultNow().notNull(),

    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    workerIdIdx: index("worker_area_override_worker_id_idx").on(table.workerId),
    dateIdx: index("worker_area_override_date_idx").on(table.date),
    workerDateUnique: unique("worker_area_override_worker_id_date_key").on(
      table.workerId,
      table.date,
    ),
  }),
);

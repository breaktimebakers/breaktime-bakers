import { pgTable, varchar, date, timestamp, index, unique } from "drizzle-orm/pg-core";
import { workers } from "./worker.schema.js";
import { areas } from "../sales/area.schema.js";

// A one-off change to a marketer's area for a single date, overriding
// whatever worker_weekly_area says for that weekday - "he's normally in
// Rabale on Thursdays, but move him to Nerul just this Thursday". The
// recurring row is never touched; the next Thursday reverts on its own.
// A null areaId means "explicitly off today", distinct from no row at all
// (which falls back to the weekly default).
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

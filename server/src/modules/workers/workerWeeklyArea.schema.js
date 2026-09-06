import { pgTable, varchar, index, unique } from "drizzle-orm/pg-core";
import { workers } from "./worker.schema.js";
import { areas } from "../sales/area.schema.js";

// Retained only to preserve legacy data during schema pushes. Daily scheduling
// never reads or writes this table; old recurring routes are inactive.
export const workerWeeklyArea = pgTable(
  "worker_weekly_area",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    workerId: varchar("worker_id", { length: 36 })
      .notNull()
      .references(() => workers.id, { onDelete: "cascade" }),

    // "Sunday" / "Monday" / ... - free varchar, not a pg enum, validated
    // at the Zod layer (see schedule.validation.js), same pattern as
    // workers.weekOffDay.
    weekday: varchar("weekday", { length: 10 }).notNull(),

    areaId: varchar("area_id", { length: 36 }).references(() => areas.id),
  },
  (table) => ({
    workerIdIdx: index("worker_weekly_area_worker_id_idx").on(table.workerId),
    areaIdIdx: index("worker_weekly_area_area_id_idx").on(table.areaId),
    workerWeekdayUnique: unique("worker_weekly_area_worker_id_weekday_key").on(
      table.workerId,
      table.weekday,
    ),
  }),
);

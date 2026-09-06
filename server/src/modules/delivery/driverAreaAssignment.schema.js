import { pgTable, varchar, date, timestamp, index, unique } from "drizzle-orm/pg-core";
import { workers } from "../workers/worker.schema.js";
import { areas } from "../sales/area.schema.js";

// A driver can cover several areas on the same date, unlike the
// order-taker's worker_area_override (one nullable area per worker/date) -
// so this is a join table: presence of a row means assigned, absence means
// not, with no null-area "cleared" state to represent.
export const driverAreaAssignments = pgTable(
  "driver_area_assignments",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    driverId: varchar("driver_id", { length: 36 })
      .notNull()
      .references(() => workers.id, { onDelete: "cascade" }),

    date: date("date", { mode: "string" }).notNull(),

    areaId: varchar("area_id", { length: 36 })
      .notNull()
      .references(() => areas.id, { onDelete: "restrict" }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    driverDateIdx: index("driver_area_assignments_driver_date_idx").on(table.driverId, table.date),
    areaDateIdx: index("driver_area_assignments_area_date_idx").on(table.areaId, table.date),
    driverDateAreaUnique: unique("driver_area_assignments_driver_date_area_key").on(
      table.driverId,
      table.date,
      table.areaId,
    ),
  }),
);

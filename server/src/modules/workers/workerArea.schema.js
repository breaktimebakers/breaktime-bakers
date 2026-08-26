import { pgTable, varchar, index, unique } from "drizzle-orm/pg-core";
import { workers } from "./worker.schema.js";
import { areas } from "../sales/area.schema.js";

// A marketer's sales territories - which areas they're responsible for
// taking orders in (see AssignAreasModal on the client). Many-to-many: a
// worker can be assigned several areas, and nothing here stops an area
// having more than one assigned worker either - not a business rule this
// table enforces.
export const workerAreas = pgTable(
  "worker_areas",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    workerId: varchar("worker_id", { length: 36 })
      .notNull()
      .references(() => workers.id, { onDelete: "cascade" }),

    areaId: varchar("area_id", { length: 36 })
      .notNull()
      .references(() => areas.id, { onDelete: "cascade" }),
  },
  (table) => ({
    workerIdIdx: index("worker_areas_worker_id_idx").on(table.workerId),
    areaIdIdx: index("worker_areas_area_id_idx").on(table.areaId),
    workerAreaUnique: unique("worker_areas_worker_id_area_id_key").on(table.workerId, table.areaId),
  }),
);

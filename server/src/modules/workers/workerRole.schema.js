import { pgTable, varchar, index, unique } from "drizzle-orm/pg-core";
import { workers } from "./worker.schema.js";

// One row per (worker, role) - a worker can hold more than one role (e.g.
// chef + marketer), and this is queried both ways: "roles for worker X"
// and "all workers with role marketer" (Orders' order-taker picker, and a
// future Deliveries' assignment picker).
export const workerRoles = pgTable(
  "worker_roles",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    workerId: varchar("worker_id", { length: 36 })
      .notNull()
      .references(() => workers.id, { onDelete: "cascade" }),

    // "chef" / "labour" / "delivery" / "marketer" - free varchar, not a pg
    // enum, validated at the Zod layer (see worker.validation.js) so a new
    // role never needs a migration.
    role: varchar("role", { length: 20 }).notNull(),
  },
  (table) => ({
    workerIdIdx: index("worker_roles_worker_id_idx").on(table.workerId),
    roleIdx: index("worker_roles_role_idx").on(table.role),
    workerRoleUnique: unique("worker_roles_worker_id_role_key").on(table.workerId, table.role),
  }),
);

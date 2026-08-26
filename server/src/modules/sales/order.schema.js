import { pgTable, varchar, date, timestamp, index } from "drizzle-orm/pg-core";
import { stores } from "./store.schema.js";
import { workers } from "../workers/worker.schema.js";

export const orders = pgTable(
  "orders",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    storeId: varchar("store_id", { length: 36 })
      .notNull()
      .references(() => stores.id, { onDelete: "restrict" }),

    // Must hold the "marketer" role - checked in order.service.js, not
    // here, since roles live in a separate join table (worker_roles) that
    // a DB FK can't express a "has this role" constraint against.
    orderTakerId: varchar("order_taker_id", { length: 36 })
      .notNull()
      .references(() => workers.id, { onDelete: "restrict" }),

    // "in_transit" / "shipped" / "delivered" - free varchar, not a pg
    // enum, validated at the Zod layer (see order.validation.js).
    status: varchar("status", { length: 20 }).notNull().default("in_transit"),

    orderDate: date("order_date", { mode: "string" }).notNull(),

    // One fulfillment event covers the whole order (see FillOrderModal) -
    // per-line fulfilledQty lives on order_items; this is just when.
    fulfillmentDate: date("fulfillment_date", { mode: "string" }),

    notes: varchar("notes", { length: 1000 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),

    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    // Orders defaults to and filters heavily by date range ("today" by
    // default), plus per-store and per-order-taker breakdowns.
    orderDateIdx: index("orders_order_date_idx").on(table.orderDate),
    storeIdIdx: index("orders_store_id_idx").on(table.storeId),
    orderTakerIdIdx: index("orders_order_taker_id_idx").on(table.orderTakerId),
  }),
);

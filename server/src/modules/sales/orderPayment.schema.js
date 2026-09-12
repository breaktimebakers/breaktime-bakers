import { pgTable, varchar, numeric, date, timestamp, index } from "drizzle-orm/pg-core";
import { orders } from "./order.schema.js";
import { workers } from "../workers/worker.schema.js";

// One row per payment collection event against a specific order - a store's
// balance is never a single pooled number, it's the sum of its individual
// orders' balances (each order's billed amount minus payments logged
// against that exact orderId). This is what lets a delivery guy tell a
// shop owner "order #X still owes ₹Y" rather than one vague store total,
// and lets an admin see who collected what and when, per order.
//
// Nothing here is a running total column - billed/paid/balance are always
// computed at read time from order_items + this table (see
// orderPayment.repository.js), same "never store a derivable number"
// idiom as raw materials' stockQty and ready stock's availableQty.
export const orderPayments = pgTable(
  "order_payments",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    orderId: varchar("order_id", { length: 36 })
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),

    amount: numeric("amount", { precision: 12, scale: 2, mode: "number" }).notNull(),

    // Nullable - an admin recording a payment directly (not through a
    // delivery guy's fulfillment) may have no specific collector to
    // attribute it to. When set, must hold the "delivery" role - checked
    // in orderPayment.service.js, same pattern as orders' orderTakerId
    // requiring the "marketer" role.
    collectedBy: varchar("collected_by", { length: 36 }).references(() => workers.id, { onDelete: "set null" }),

    paymentDate: date("payment_date", { mode: "string" }).notNull(),

    notes: varchar("notes", { length: 1000 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),

    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orderIdIdx: index("order_payments_order_id_idx").on(table.orderId),
    paymentDateIdx: index("order_payments_payment_date_idx").on(table.paymentDate),
  }),
);

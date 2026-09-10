import { pgTable, varchar, date, timestamp, index, unique } from "drizzle-orm/pg-core";
import { stores } from "./store.schema.js";
import { workers } from "../workers/worker.schema.js";

// A record that an order taker visited a store on a given date and found
// it closed, instead of the usual outcome (an order in the `orders`
// table). Deliberately its own table, not a fake zero-item order or a
// new orders.status value - an order row represents a sale, and a closed
// visit isn't one. One row per (store, date): a store is either closed
// that day or it isn't, regardless of which order taker found it that way.
export const storeVisitNotes = pgTable(
  "store_visit_notes",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    storeId: varchar("store_id", { length: 36 })
      .notNull()
      .references(() => stores.id, { onDelete: "restrict" }),

    // Must hold the "marketer" role, same rule/reasoning as
    // orders.orderTakerId - checked in the service layer, not here.
    orderTakerId: varchar("order_taker_id", { length: 36 })
      .notNull()
      .references(() => workers.id, { onDelete: "restrict" }),

    visitDate: date("visit_date", { mode: "string" }).notNull(),

    // A closed enum of "why no order today" outcomes rather than free
    // text - lets the Orders page render/filter on it directly instead of
    // parsing prose. "OTHER" is the escape hatch for anything that
    // doesn't fit, and is the only code that requires `note` (enforced in
    // storeVisitNote.validation.js, not here).
    reasonCode: varchar("reason_code", { length: 30 }).notNull(),

    // Optional free-text detail. Required only when reasonCode is
    // "OTHER" - everywhere else the code alone is the reason.
    note: varchar("note", { length: 500 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    storeDateUnique: unique("store_visit_notes_store_id_visit_date_key").on(table.storeId, table.visitDate),
    orderTakerIdIdx: index("store_visit_notes_order_taker_id_idx").on(table.orderTakerId),
    visitDateIdx: index("store_visit_notes_visit_date_idx").on(table.visitDate),
  }),
);

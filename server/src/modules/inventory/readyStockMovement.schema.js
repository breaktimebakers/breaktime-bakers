import { pgTable, varchar, numeric, timestamp, index } from "drizzle-orm/pg-core";
import { products } from "./product.schema.js";
import { batches } from "./batch.schema.js";

// availableQty is never stored on products - it's SUM(quantity) here,
// computed at read time, same reasoning as raw material stockQty. quantity
// is signed: positive for stock added (production today; a sale or
// wastage entry later would be negative). batchId is nullable because not
// every future movement will trace back to a batch (a manual adjustment
// or a sale won't).
export const readyStockMovements = pgTable(
  "ready_stock_movements",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    productId: varchar("product_id", { length: 36 })
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),

    batchId: varchar("batch_id", { length: 36 }).references(() => batches.id, { onDelete: "set null" }),

    quantity: numeric("quantity", { precision: 12, scale: 3, mode: "number" }).notNull(),

    // Free text, not a DB enum, matching how `unit` is handled elsewhere
    // in this schema - "production" for now; "sale" / "adjustment" /
    // "wastage" are the obvious future values, added without a migration.
    reason: varchar("reason", { length: 20 }).notNull(),

    occurredAt: timestamp("occurred_at").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    productOccurredAtIdx: index("ready_stock_movements_product_id_occurred_at_idx").on(
      table.productId,
      table.occurredAt,
    ),
  }),
);

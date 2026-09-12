import { pgTable, varchar, numeric, timestamp, index, unique } from "drizzle-orm/pg-core";
import { orders } from "./order.schema.js";
import { products } from "../inventory/product.schema.js";

export const orderItems = pgTable(
  "order_items",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    orderId: varchar("order_id", { length: 36 })
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),

    productId: varchar("product_id", { length: 36 })
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),

    quantity: numeric("quantity", { precision: 12, scale: 3, mode: "number" }).notNull(),

    fulfilledQty: numeric("fulfilled_qty", { precision: 12, scale: 3, mode: "number" }).notNull().default(0),

    // Snapshotted from products.pricePerUnit at order-creation time - the
    // agreed price for this order, same "capture once, never re-derive"
    // idiom as batches.pricePerUnit. Nullable only because rows created
    // before this column existed have no historical price to backfill
    // exactly (see scripts/backfillOrderItemPrices.js). Order value is
    // always fulfilledQty * pricePerUnit, not quantity * pricePerUnit -
    // only what actually left the bakery is billed (see
    // orderPayment.repository.js).
    pricePerUnit: numeric("price_per_unit", { precision: 12, scale: 2, mode: "number" }),

    createdAt: timestamp("created_at").defaultNow().notNull(),

    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orderIdIdx: index("order_items_order_id_idx").on(table.orderId),
    productIdIdx: index("order_items_product_id_idx").on(table.productId),
    // No duplicate product line on the same order - combine quantities
    // into a single line instead, same rule as a batch's ingredient lines.
    orderProductUnique: unique("order_items_order_id_product_id_key").on(table.orderId, table.productId),
  }),
);

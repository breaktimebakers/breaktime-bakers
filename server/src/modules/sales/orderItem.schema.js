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

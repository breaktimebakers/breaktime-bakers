import { pgTable, varchar, numeric, date, timestamp, index } from "drizzle-orm/pg-core";
import { products } from "../inventory/product.schema.js";

// A walk-in/counter sale: instant, paid (or partially paid) on the spot,
// no delivery lifecycle - unlike orders, which always carry a store,
// order taker, and in_transit/shipped/delivered status. Recording one
// also writes a matching ready_stock_movements row (reason: "sale") so it
// draws down Ready Stock the same way order fulfillment does.
export const walkInSales = pgTable(
  "walk_in_sales",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    productId: varchar("product_id", { length: 36 })
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),

    quantity: numeric("quantity", { precision: 12, scale: 3, mode: "number" }).notNull(),

    // Entered manually, not derived from products.pricePerUnit - counter
    // rate can differ from the catalog price on any given sale.
    amount: numeric("amount", { precision: 12, scale: 2, mode: "number" }).notNull(),

    // "paid" / "partial" - free varchar, not a pg enum, same idiom as
    // orders.status.
    paymentStatus: varchar("payment_status", { length: 20 }).notNull().default("paid"),

    // What's actually been received so far. Equals `amount` whenever
    // paymentStatus is "paid" (set that way on create and again by
    // settleWalkInSale) - never a separate ledger of individual
    // installments, just the running total, same "single number" idiom
    // as worker_advances' cap check rather than a payment history table.
    amountPaid: numeric("amount_paid", { precision: 12, scale: 2, mode: "number" }).notNull().default(0),

    saleDate: date("sale_date", { mode: "string" }).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),

    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    saleDateIdx: index("walk_in_sales_sale_date_idx").on(table.saleDate),
  }),
);

// One-off backfill for order_items rows created before pricePerUnit existed
// on that table (see orderItem.schema.js). Sets each null price to the
// product's *current* pricePerUnit - a best-effort stand-in for demo/
// historical data, not a claim that it matches whatever the real price was
// on that order's actual date. Safe to re-run: only touches rows that are
// still null, so it's a no-op once everything has a price.
import { isNull, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { orderItems } from "../modules/sales/orderItem.schema.js";
import { products } from "../modules/inventory/product.schema.js";

const run = async () => {
  const result = await db
    .update(orderItems)
    .set({ pricePerUnit: sql`${products.pricePerUnit}`, updatedAt: new Date() })
    .from(products)
    .where(sql`${orderItems.productId} = ${products.id} AND ${isNull(orderItems.pricePerUnit)}`)
    .returning({ id: orderItems.id });

  console.log(`Backfilled pricePerUnit on ${result.length} order item(s).`);
  process.exit(0);
};

run().catch((err) => {
  console.error("Backfill failed", err);
  process.exit(1);
});

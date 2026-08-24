import { and, asc, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { products } from "./product.schema.js";

// Never stored - SUM(quantity) across a product's ready_stock_movements,
// computed at read time. Same reasoning as raw material stockQty: two
// admins logging batches for the same product at once can't leave a
// denormalized counter out of sync. Deliberately NOT scoped to the
// from/to window below - the qty shown is always the true current
// balance, even when the product list itself is narrowed to "made today".
const availableQtySql = sql`COALESCE((
  SELECT SUM(rsm.quantity)
  FROM ready_stock_movements rsm
  WHERE rsm.product_id = products.id
), 0)`.mapWith(Number);

const productSelection = {
  id: products.id,
  name: products.name,
  unit: products.unit,
  pricePerUnit: products.pricePerUnit,
  availableQty: availableQtySql,
};

export const listReadyStock = async ({ from, to } = {}) => {
  const conditions = [];

  // Which PRODUCTS appear - did this one have any stock movement in the
  // window? Only narrows the list; availableQtySql above stays unscoped.
  if (from || to) {
    const fromClause = from ? sql`AND rsm.occurred_at >= ${from}::date` : sql``;
    const toClause = to ? sql`AND rsm.occurred_at <= (${to}::date + interval '1 day')` : sql``;

    conditions.push(sql`EXISTS (
      SELECT 1 FROM ready_stock_movements rsm
      WHERE rsm.product_id = products.id
      ${fromClause}
      ${toClause}
    )`);
  }

  const rows = await db
    .select(productSelection)
    .from(products)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(products.name));

  return rows.map((row) => ({
    ...row,
    totalValue: row.availableQty * (row.pricePerUnit || 0),
  }));
};

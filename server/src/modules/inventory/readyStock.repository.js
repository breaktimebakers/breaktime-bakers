import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { products } from "./product.schema.js";
import { readyStockMovements } from "./readyStockMovement.schema.js";
import { batches } from "./batch.schema.js";

const numberOrNull = (value) => (value === null || value === undefined ? null : Number(value));

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

// Unlike availableQty, price IS scoped to `to` - the price on the most
// recent production batch on/before that date (or now, if `to` is
// unbounded), not products.pricePerUnit (always today's live price).
// This is what makes a past custom-range export show what a product
// actually sold for back then instead of silently substituting today's
// price. Ties within the same day break on the movement's created_at,
// which matches insertion order since each batch writes its movement in
// the same transaction. Skips batches with no price on file - price used
// to be optional, so an old unpriced batch shouldn't hide a real price
// an earlier batch already had. null only if the product had no PRICED
// production yet as of `to` - honest "unknown" rather than a wrong guess.
const priceAsOfSql = (to) => sql`(
  SELECT b.price_per_unit
  FROM ready_stock_movements rsm2
  JOIN batches b ON b.id = rsm2.batch_id
  WHERE rsm2.product_id = products.id
    AND rsm2.batch_id IS NOT NULL
    AND b.price_per_unit IS NOT NULL
    AND rsm2.occurred_at <= ${to ? sql`(${to}::date + interval '1 day')` : sql`now()`}
  ORDER BY rsm2.occurred_at DESC, rsm2.created_at DESC
  LIMIT 1
)`.mapWith(numberOrNull);

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
    .select({
      id: products.id,
      name: products.name,
      unit: products.unit,
      pricePerUnit: priceAsOfSql(to).as("price_per_unit"),
      availableQty: availableQtySql,
    })
    .from(products)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(products.name));

  return rows.map((row) => ({
    ...row,
    totalValue: row.availableQty * (row.pricePerUnit || 0),
  }));
};

const stockHistorySelection = {
  id: readyStockMovements.id,
  date: readyStockMovements.occurredAt,
  quantity: readyStockMovements.quantity,
  pricePerUnit: batches.pricePerUnit,
};

// Every production batch that added to this product's ready stock, in a
// window (month by default - see resolveMonthRange in readyStock.service.js).
// reason = "production" scopes this to genuine incoming stock, same as
// priceAsOfSql above - a future "sale"/"adjustment"/"wastage" movement
// isn't stock being *added*, so it has no place in this history.
export const listStockHistoryForProduct = async (productId, { from, to } = {}) => {
  const conditions = [eq(readyStockMovements.productId, productId), eq(readyStockMovements.reason, "production")];

  if (from) conditions.push(sql`${readyStockMovements.occurredAt} >= ${from}::date`);
  if (to) conditions.push(sql`${readyStockMovements.occurredAt} <= (${to}::date + interval '1 day')`);

  return db
    .select(stockHistorySelection)
    .from(readyStockMovements)
    .innerJoin(batches, eq(readyStockMovements.batchId, batches.id))
    .where(and(...conditions))
    .orderBy(asc(readyStockMovements.occurredAt));
};

import { and, asc, desc, eq, sql } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import { db } from "../../db/index.js";
import { httpError } from "../../utils/httpError.js";
import { orders } from "./order.schema.js";
import { orderItems } from "./orderItem.schema.js";
import { orderPayments } from "./orderPayment.schema.js";
import { stores } from "./store.schema.js";
import { areas } from "./area.schema.js";
import { workers } from "../workers/worker.schema.js";

// Billed/paid/balance are never stored columns - always summed at read time
// from order_items and order_payments, same "don't store a derivable
// number" idiom as raw materials' stockQty and ready stock's availableQty.
// Billed is deliberately fulfilledQty * pricePerUnit, not the ordered
// quantity - only what's actually left the bakery is owed. SUM already
// skips a NULL pricePerUnit (a pre-backfill row), so no extra guard needed.
// Deliberately "orders.id" as literal SQL text, not an interpolated
// ${orders.id} column reference - inside a nested subquery, drizzle
// renders an interpolated Column unqualified (just "id"), which then
// silently binds to the subquery's own inner alias (oi.id / op.id)
// instead of the outer orders table, making the correlation always false.
const billedAmountSql = sql`COALESCE((
  SELECT SUM(oi.fulfilled_qty * oi.price_per_unit)
  FROM order_items oi
  WHERE oi.order_id = orders.id
), 0)`;

const paidAmountSql = sql`COALESCE((
  SELECT SUM(op.amount)
  FROM order_payments op
  WHERE op.order_id = orders.id
), 0)`;

const orderPaymentSelection = {
  id: orderPayments.id,
  orderId: orderPayments.orderId,
  amount: orderPayments.amount,
  collectedBy: orderPayments.collectedBy,
  collectedByName: workers.name,
  paymentDate: orderPayments.paymentDate,
  notes: orderPayments.notes,
  createdAt: orderPayments.createdAt,
};

const withCollectorJoin = (qb) =>
  qb.from(orderPayments).leftJoin(workers, eq(orderPayments.collectedBy, workers.id));

export const findOrderPaymentById = async (id) => {
  const rows = await withCollectorJoin(db.select(orderPaymentSelection)).where(eq(orderPayments.id, id));

  return rows[0];
};

export const listPaymentsForOrder = (orderId) =>
  withCollectorJoin(db.select(orderPaymentSelection))
    .where(eq(orderPayments.orderId, orderId))
    .orderBy(desc(orderPayments.paymentDate), desc(orderPayments.createdAt));

// Row-locks the order for the duration of the transaction (same reasoning
// as locking the product row in order.repository.js's fulfillOrder) so two
// concurrent payments against the same order can't both read the same
// billed/paid snapshot and jointly overpay it.
export const recordPayment = async ({ orderId, amount, collectedBy, paymentDate, notes }) => {
  const id = await db.transaction(async (tx) => {
    const [order] = await tx.select({ id: orders.id }).from(orders).where(eq(orders.id, orderId)).for("update");

    if (!order) {
      throw httpError(404, "Order not found");
    }

    const [{ billed, paid }] = await tx
      .select({ billed: billedAmountSql.mapWith(Number), paid: paidAmountSql.mapWith(Number) })
      .from(orders)
      .where(eq(orders.id, orderId));

    const balance = billed - paid;
    if (amount > balance) {
      throw httpError(422, `Payment exceeds remaining balance of ₹${balance.toFixed(2)}`, "PAYMENT_EXCEEDS_BALANCE");
    }

    const paymentId = uuidv7();
    await tx.insert(orderPayments).values({ id: paymentId, orderId, amount, collectedBy: collectedBy || null, paymentDate, notes: notes || null });

    return paymentId;
  });

  return findOrderPaymentById(id);
};

// Distinct collectors (id + name) who logged a payment against this order -
// what lets the store ledger's "collected by" filter work without an N+1
// per-order payment fetch. Same literal-outer-reference caveat as
// billedAmountSql/paidAmountSql above.
const collectorsSql = sql`COALESCE((
  SELECT json_agg(DISTINCT jsonb_build_object('id', w.id, 'name', w.name))
  FROM order_payments op
  JOIN workers w ON w.id = op.collected_by
  WHERE op.order_id = orders.id
), '[]'::json)`;

// Every order for this store that has something actually billed (delivered
// or partially delivered - nothing owed on stock that never left the
// bakery), newest first. This is the order-level ledger
// CustomerPaymentsStore.jsx renders - paid and unpaid orders alike, so an
// admin can audit full history, not just chase what's outstanding.
export const listStoreOrderLedger = (storeId) =>
  db
    .select({
      id: orders.id,
      orderDate: orders.orderDate,
      fulfillmentDate: orders.fulfillmentDate,
      status: orders.status,
      orderTakerName: workers.name,
      billed: billedAmountSql.mapWith(Number),
      paid: paidAmountSql.mapWith(Number),
      collectors: collectorsSql,
    })
    .from(orders)
    .innerJoin(workers, eq(orders.orderTakerId, workers.id))
    .where(and(eq(orders.storeId, storeId), sql`${billedAmountSql} > 0`))
    .orderBy(desc(orders.orderDate), desc(orders.createdAt));

export const getStorePaymentSummary = async (storeId) => {
  const [row] = await db
    .select({
      totalBilled: sql`COALESCE(SUM(${billedAmountSql}), 0)`.mapWith(Number),
      paid: sql`COALESCE(SUM(${paidAmountSql}), 0)`.mapWith(Number),
    })
    .from(orders)
    .where(eq(orders.storeId, storeId));

  return { totalBilled: row.totalBilled, paid: row.paid, outstanding: row.totalBilled - row.paid };
};

// One grouped query for every area's totals - replaces the old client-side
// pattern of calling a per-area summary function in a loop (an N+1 query
// this avoids entirely).
export const getAreaPaymentSummaries = async () => {
  const rows = await db
    .select({
      areaId: areas.id,
      areaName: areas.name,
      storeCount: sql`COUNT(DISTINCT ${stores.id})`.mapWith(Number),
      totalBilled: sql`COALESCE(SUM(${billedAmountSql}), 0)`.mapWith(Number),
      paid: sql`COALESCE(SUM(${paidAmountSql}), 0)`.mapWith(Number),
    })
    .from(areas)
    .innerJoin(stores, eq(stores.areaId, areas.id))
    .leftJoin(orders, eq(orders.storeId, stores.id))
    .groupBy(areas.id, areas.name)
    .orderBy(asc(areas.name));

  return rows.map((r) => ({ ...r, outstanding: r.totalBilled - r.paid }));
};

// Per-store rows within one area - what CustomerPaymentsArea.jsx's store
// table renders. Separate from getAreaPaymentSummaries (that one rolls
// every area up to a single total each, for the top-level area cards);
// this one stays at store granularity for a single area.
export const listStoreSummariesForArea = (areaId, { from, to } = {}) => {
  const orderJoinConditions = [eq(orders.storeId, stores.id)];
  if (from) orderJoinConditions.push(sql`${orders.orderDate} >= ${from}`);
  if (to) orderJoinConditions.push(sql`${orders.orderDate} <= ${to}`);

  return db
    .select({
      storeId: stores.id,
      storeName: stores.dealerName,
      storeType: stores.storeType,
      totalBilled: sql`COALESCE(SUM(${billedAmountSql}), 0)`.mapWith(Number),
      paid: sql`COALESCE(SUM(${paidAmountSql}), 0)`.mapWith(Number),
    })
    .from(stores)
    .leftJoin(orders, and(...orderJoinConditions))
    .where(eq(stores.areaId, areaId))
    .groupBy(stores.id, stores.dealerName, stores.storeType)
    // When a date is selected, omit stores with no orders in that period.
    // The unfiltered view continues to show every store in the area.
    .having(from || to ? sql`COUNT(${orders.id}) > 0` : undefined)
    .orderBy(asc(stores.dealerName));
};

export const getOverviewTotals = async () => {
  const [row] = await db
    .select({
      totalBilled: sql`COALESCE(SUM(${billedAmountSql}), 0)`.mapWith(Number),
      paid: sql`COALESCE(SUM(${paidAmountSql}), 0)`.mapWith(Number),
    })
    .from(orders);

  return { totalBilled: row.totalBilled, paid: row.paid, outstanding: row.totalBilled - row.paid };
};

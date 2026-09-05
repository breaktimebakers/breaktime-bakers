import { and, asc, count, desc, eq, gte, ilike, lte, ne, or, sql } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import { db } from "../../db/index.js";
import { todayIso } from "../../utils/dateRange.js";
import { orders } from "./order.schema.js";
import { orderItems } from "./orderItem.schema.js";
import { stores } from "./store.schema.js";
import { areas } from "./area.schema.js";
import { workers } from "../workers/worker.schema.js";

// Line items, aggregated per order - a single order can carry several
// products (see orderItem.schema.js). productName/unit are joined in here
// rather than forcing every order-list consumer to also fetch the full
// products list, same reasoning as a batch's ingredientsUsed.
const orderItemsSql = sql`COALESCE((
  SELECT json_agg(json_build_object(
           'id', oi.id,
           'productId', oi.product_id,
           'productName', p.name,
           'unit', p.unit,
           'quantity', oi.quantity,
           'fulfilledQty', oi.fulfilled_qty
         ) ORDER BY p.name)
  FROM order_items oi
  JOIN products p ON p.id = oi.product_id
  WHERE oi.order_id = orders.id
), '[]'::json)`;

const orderSelection = {
  id: orders.id,
  storeId: orders.storeId,
  orderTakerId: orders.orderTakerId,
  status: orders.status,
  orderDate: orders.orderDate,
  fulfillmentDate: orders.fulfillmentDate,
  notes: orders.notes,
  createdAt: orders.createdAt,
  updatedAt: orders.updatedAt,
  items: orderItemsSql,
};

const buildOrderConditions = ({ from, to, areaId, storeId, status, orderTakerId, productId, search } = {}) => {
  const conditions = [];

  if (from) conditions.push(gte(orders.orderDate, from));
  if (to) conditions.push(lte(orders.orderDate, to));
  if (storeId) conditions.push(eq(orders.storeId, storeId));
  if (orderTakerId) conditions.push(eq(orders.orderTakerId, orderTakerId));
  if (status === "delivered") conditions.push(eq(orders.status, "delivered"));
  if (status === "undelivered") conditions.push(ne(orders.status, "delivered"));
  if (areaId) conditions.push(eq(stores.areaId, areaId));
  if (productId) {
    conditions.push(
      sql`EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = ${orders.id} AND oi.product_id = ${productId})`,
    );
  }

  if (search) {
    // Treat LIKE wildcards as literal characters, matching the UI's substring search.
    const pattern = `%${search.replace(/[\\%_]/g, "\\$&")}%`;
    conditions.push(or(
      ilike(stores.dealerName, pattern),
      ilike(workers.name, pattern),
      ilike(orders.id, pattern),
      sql`EXISTS (
        SELECT 1 FROM order_items oi
        JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id = ${orders.id} AND p.name ILIKE ${pattern}
      )`,
    ));
  }

  return conditions.length ? and(...conditions) : undefined;
};

const totalQuantitySql = sql`COALESCE((
  SELECT SUM(oi.quantity) FROM order_items oi WHERE oi.order_id = ${orders.id}
), 0)`;

const productsLabelSql = sql`COALESCE((
  SELECT MIN(p.name) || CASE WHEN COUNT(*) > 1 THEN ' +' || (COUNT(*) - 1)::text || ' more' ELSE '' END
  FROM order_items oi JOIN products p ON p.id = oi.product_id
  WHERE oi.order_id = ${orders.id}
), '—')`;

export const listOrders = async (query = {}) => {
  const { page, pageSize = 10, sortKey = "orderDate", sortDir = "desc" } = query;
  const sortColumns = {
    otName: workers.name,
    storeName: stores.dealerName,
    areaName: areas.name,
    productsLabel: productsLabelSql,
    totalQty: totalQuantitySql,
    status: orders.status,
    orderDate: orders.orderDate,
  };
  const direction = sortDir === "asc" ? asc : desc;
  const statement = db
    .select({
      ...orderSelection,
      otName: workers.name,
      storeName: stores.dealerName,
      areaName: areas.name,
      productsLabel: productsLabelSql,
      totalQty: totalQuantitySql.mapWith(Number),
    })
    .from(orders)
    .innerJoin(stores, eq(orders.storeId, stores.id))
    .innerJoin(workers, eq(orders.orderTakerId, workers.id))
    .leftJoin(areas, eq(stores.areaId, areas.id))
    .where(buildOrderConditions(query))
    // A unique tie-breaker prevents equal sort values moving between pages.
    .orderBy(direction(sortColumns[sortKey] || orders.orderDate), desc(orders.createdAt), desc(orders.id));

  if (page !== undefined) {
    return statement.limit(pageSize).offset((page - 1) * pageSize);
  }

  return statement;
};

export const countOrders = async (query = {}) => {
  const [result] = await db
    .select({ total: count() })
    .from(orders)
    .innerJoin(stores, eq(orders.storeId, stores.id))
    .innerJoin(workers, eq(orders.orderTakerId, workers.id))
    .where(buildOrderConditions(query));

  return result.total;
};

// Cards show lifetime totals, independently of the table's filters and page.
export const countOrdersByOrderTaker = () => db
  .select({ orderTakerId: orders.orderTakerId, total: count() })
  .from(orders)
  .groupBy(orders.orderTakerId);

export const findOrderById = async (id) => {
  const rows = await db.select(orderSelection).from(orders).where(eq(orders.id, id));

  return rows[0];
};

export const createOrderWithItems = async ({ storeId, orderTakerId, items, notes }) => {
  const orderId = await db.transaction(async (tx) => {
    const id = uuidv7();

    await tx.insert(orders).values({
      id,
      storeId,
      orderTakerId,
      orderDate: todayIso(),
      notes: notes || null,
    });

    await tx.insert(orderItems).values(
      items.map((line) => ({
        id: uuidv7(),
        orderId: id,
        productId: line.productId,
        quantity: line.quantity,
      })),
    );

    return id;
  });

  return findOrderById(orderId);
};

export const updateOrderStatus = async (id, status) => {
  const result = await db
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(eq(orders.id, id))
    .returning({ id: orders.id });

  if (!result[0]) return undefined;

  return findOrderById(id);
};

export const fulfillOrder = async (id, { status, fulfillmentDate, notes, items }) => {
  await db.transaction(async (tx) => {
    await tx
      .update(orders)
      .set({ status, fulfillmentDate: fulfillmentDate || null, notes: notes || null, updatedAt: new Date() })
      .where(eq(orders.id, id));

    for (const line of items) {
      await tx
        .update(orderItems)
        .set({ fulfilledQty: line.fulfilledQty, updatedAt: new Date() })
        .where(and(eq(orderItems.id, line.itemId), eq(orderItems.orderId, id)));
    }
  });

  return findOrderById(id);
};

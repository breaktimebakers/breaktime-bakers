import { and, asc, count, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { areas } from "../sales/area.schema.js";
import { orders } from "../sales/order.schema.js";
import { stores } from "../sales/store.schema.js";
import { workers } from "../workers/worker.schema.js";
import { driverAreaAssignments } from "./driverAreaAssignment.schema.js";

const totalOrdersSql = sql`COUNT(${orders.id})`.mapWith(Number);
const deliveredOrdersSql = sql`COUNT(${orders.id}) FILTER (WHERE ${orders.status} = 'delivered')`.mapWith(Number);
const statusSql = sql`CASE
  WHEN COUNT(${orders.id}) = 0 THEN 'no_orders'
  WHEN COUNT(${orders.id}) FILTER (WHERE ${orders.status} = 'delivered') = COUNT(${orders.id}) THEN 'delivered'
  WHEN COUNT(${orders.id}) FILTER (WHERE ${orders.status} = 'delivered') > 0 THEN 'partial'
  ELSE 'pending'
END`;

const buildConditions = ({ from, to, areaId, driverId, search } = {}) => {
  const conditions = [];

  if (from) conditions.push(gte(driverAreaAssignments.date, from));
  if (to) conditions.push(lte(driverAreaAssignments.date, to));
  if (areaId) conditions.push(eq(driverAreaAssignments.areaId, areaId));
  if (driverId) conditions.push(eq(driverAreaAssignments.driverId, driverId));

  if (search) {
    // Treat LIKE wildcards as literal characters, matching the other list queries.
    const pattern = `%${search.replace(/[\\%_]/g, "\\$&")}%`;
    conditions.push(or(
      ilike(stores.dealerName, pattern),
      ilike(areas.name, pattern),
      ilike(workers.name, pattern),
    ));
  }

  return conditions.length ? and(...conditions) : undefined;
};

const buildStatusCondition = (status) => {
  if (!status || status === "all") return undefined;
  if (status === "no_orders") return sql`COUNT(${orders.id}) = 0`;

  const delivered = sql`COUNT(${orders.id}) FILTER (WHERE ${orders.status} = 'delivered')`;
  const total = sql`COUNT(${orders.id})`;

  if (status === "delivered") return sql`${total} > 0 AND ${delivered} = ${total}`;
  if (status === "partial") return sql`${delivered} > 0 AND ${delivered} < ${total}`;
  return sql`${total} > 0 AND ${delivered} = 0`;
};

const groupedStatusQuery = (query) => {
  const statement = db
    .select({
      date: driverAreaAssignments.date,
      storeId: stores.id,
      storeName: stores.dealerName,
      areaId: areas.id,
      areaName: areas.name,
      driverId: workers.id,
      driverName: workers.name,
      totalOrders: totalOrdersSql,
      deliveredOrders: deliveredOrdersSql,
      status: statusSql,
      lastUpdated: sql`MAX(${orders.updatedAt})`,
    })
    .from(driverAreaAssignments)
    .innerJoin(areas, eq(areas.id, driverAreaAssignments.areaId))
    .innerJoin(stores, eq(stores.areaId, areas.id))
    .innerJoin(workers, eq(workers.id, driverAreaAssignments.driverId))
    .leftJoin(orders, and(
      eq(orders.storeId, stores.id),
      eq(orders.orderDate, driverAreaAssignments.date),
    ))
    .where(buildConditions(query))
    .groupBy(
      driverAreaAssignments.date,
      stores.id,
      stores.dealerName,
      areas.id,
      areas.name,
      workers.id,
      workers.name,
    );

  const statusCondition = buildStatusCondition(query.status);
  return statusCondition ? statement.having(statusCondition) : statement;
};

export const countStatusRows = async (query) => {
  const grouped = groupedStatusQuery(query).as("delivery_status_rows");
  const [result] = await db.select({ total: count() }).from(grouped);
  return result.total;
};

export const listStatusRows = async (query, pagination) => {
  const statement = groupedStatusQuery(query)
    .orderBy(desc(driverAreaAssignments.date), asc(areas.name), asc(stores.dealerName), asc(workers.name));

  if (!pagination) return statement;

  return statement.limit(pagination.pageSize).offset((pagination.page - 1) * pagination.pageSize);
};

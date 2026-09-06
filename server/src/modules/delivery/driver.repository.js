import { and, asc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { driverAreaAssignments } from "./driverAreaAssignment.schema.js";
import { areas } from "../sales/area.schema.js";
import { stores } from "../sales/store.schema.js";
import { orders } from "../sales/order.schema.js";

// Every order for this store on this date, aggregated inline - same
// "join nested collections in as JSON" idiom as order.repository.js's
// orderItemsSql, so the caller doesn't need a second round trip per store.
const ordersForStoreOnDate = (date) => sql`COALESCE((
  SELECT json_agg(json_build_object(
           'id', o.id,
           'status', o.status,
           'notes', o.notes,
           'items', (
             SELECT COALESCE(json_agg(json_build_object(
                       'productName', p.name,
                       'unit', p.unit,
                       'quantity', oi.quantity,
                       'fulfilledQty', oi.fulfilled_qty
                     ) ORDER BY p.name), '[]'::json)
             FROM order_items oi
             JOIN products p ON p.id = oi.product_id
             WHERE oi.order_id = o.id
           )
         ) ORDER BY o.created_at)
  FROM orders o
  WHERE o.store_id = stores.id AND o.order_date = ${date}
), '[]'::json)`;

// One row per store within every area assigned to this driver on this
// date, each carrying its own orders for that date - the query the whole
// module exists for. Nothing here is stored; it's assembled at read time
// from driver_area_assignments + areas + stores + orders.
export const getDriverDay = (driverId, date) => db
  .select({
    areaId: areas.id,
    areaName: areas.name,
    storeId: stores.id,
    storeName: stores.dealerName,
    shopName: stores.shopName,
    storePhone: stores.dealerPhone,
    storeAddress: stores.address,
    orders: ordersForStoreOnDate(date),
  })
  .from(driverAreaAssignments)
  .innerJoin(areas, eq(areas.id, driverAreaAssignments.areaId))
  .innerJoin(stores, eq(stores.areaId, areas.id))
  .where(and(eq(driverAreaAssignments.driverId, driverId), eq(driverAreaAssignments.date, date)))
  .orderBy(asc(areas.name), asc(stores.dealerName));

// Per-day order counts attributable to this driver over a range: a day
// counts against the driver only via that exact day's area assignment
// (order_date matched to assignment date), not the store's current area -
// so a store later moved to a different area doesn't retroactively change
// who gets credit for an already-placed order.
export const getDriverDailyCounts = (driverId, fromDate, toDate) => db
  .select({
    date: driverAreaAssignments.date,
    total: sql`COUNT(DISTINCT ${orders.id})`.mapWith(Number),
    delivered: sql`COUNT(DISTINCT ${orders.id}) FILTER (WHERE ${orders.status} = 'delivered')`.mapWith(Number),
  })
  .from(driverAreaAssignments)
  .innerJoin(stores, eq(stores.areaId, driverAreaAssignments.areaId))
  .innerJoin(orders, and(eq(orders.storeId, stores.id), eq(orders.orderDate, driverAreaAssignments.date)))
  .where(and(
    eq(driverAreaAssignments.driverId, driverId),
    gte(driverAreaAssignments.date, fromDate),
    lte(driverAreaAssignments.date, toDate),
  ))
  .groupBy(driverAreaAssignments.date);

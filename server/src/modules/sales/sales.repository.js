import { sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { areas } from "./area.schema.js";
import { stores } from "./store.schema.js";
import { orders } from "./order.schema.js";

export const getOverview = async (today) => {
  // Count in the database without loading stores or order line items.
  // Pending includes older orders; total stores includes inactive/unassigned stores.
  const [overview] = await db
    .select({
      totalAreas: sql`(SELECT COUNT(*) FROM ${areas} WHERE ${areas.isArchived} = false)`.mapWith(Number),
      totalStores: sql`(SELECT COUNT(*) FROM ${stores})`.mapWith(Number),
      ordersToday: sql`COUNT(*) FILTER (WHERE ${orders.orderDate} = ${today})`.mapWith(Number),
      ordersPending: sql`COUNT(*) FILTER (WHERE ${orders.status} <> 'delivered')`.mapWith(Number),
    })
    .from(orders);

  return overview;
};

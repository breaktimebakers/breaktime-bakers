import { and, asc, eq, inArray, ne, sql } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import { db } from "../../db/index.js";
import { httpError } from "../../utils/httpError.js";
import { workers } from "../workers/worker.schema.js";
import { driverAreaAssignments } from "./driverAreaAssignment.schema.js";

// Written with literal "workers.id"/"workers.status" text rather than
// interpolating the Column object - reusing this same fragment in both a
// SELECT-list position and a WHERE-clause position makes Drizzle qualify
// interpolated columns inconsistently between the two, and the areas
// subquery below joins two tables that each have their own "id" column,
// so an unqualified "id" there is genuinely ambiguous to Postgres, not
// just cosmetically wrong.
const activeDeliveryWorker = sql`(workers.status = 'active' AND EXISTS (
  SELECT 1 FROM worker_roles wr WHERE wr.worker_id = workers.id AND wr.role = 'delivery'
))`;

const areasForDriverOnDate = (date) => sql`COALESCE((
  SELECT json_agg(json_build_object('id', a.id, 'name', a.name) ORDER BY a.name)
  FROM driver_area_assignments daa
  JOIN areas a ON a.id = daa.area_id
  WHERE daa.driver_id = workers.id AND daa.date = ${date}
), '[]'::json)`;

// Every active delivery worker, plus any inactive/former one still holding
// an assignment on this date (so it stays visible to clear) - mirrors
// workers/schedule.repository.js's listDayAssignments for order-takers.
export const listDayAssignments = (date) => db
  .select({
    driverId: workers.id,
    driverName: workers.name,
    canAssign: activeDeliveryWorker.mapWith(Boolean),
    areas: areasForDriverOnDate(date),
  })
  .from(workers)
  .where(sql`(${activeDeliveryWorker}) OR EXISTS (
    SELECT 1 FROM driver_area_assignments daa WHERE daa.driver_id = ${workers.id} AND daa.date = ${date}
  )`)
  .orderBy(asc(workers.name));

const findAreaOwnerOnDate = (tx, areaId, date, excludeDriverId) => tx
  .select({ driverName: workers.name })
  .from(driverAreaAssignments)
  .innerJoin(workers, eq(workers.id, driverAreaAssignments.driverId))
  .where(and(
    eq(driverAreaAssignments.areaId, areaId),
    eq(driverAreaAssignments.date, date),
    ne(driverAreaAssignments.driverId, excludeDriverId),
  ));

// Replaces this driver's full set of areas for a date by diffing against
// what's already assigned, rather than delete-then-insert-all, so an
// unrelated add/remove that touches only some areas never briefly drops
// the untouched ones.
export const setDriverDayAreas = (driverId, date, areaIds) => db.transaction(async (tx) => {
  // Same "lock the date before reading conflicts" idiom as order-taker
  // scheduling - two admins can't both see an area as free and save.
  await tx.execute(sql`SELECT pg_advisory_xact_lock(741204, (${date}::date - DATE '2000-01-01')::integer)`);

  for (const areaId of areaIds) {
    const [conflict] = await findAreaOwnerOnDate(tx, areaId, date, driverId);
    if (conflict) {
      throw httpError(409, `${conflict.driverName} is already assigned to this area on ${date}`, "AREA_DOUBLE_BOOKED");
    }
  }

  const existing = await tx.select({ areaId: driverAreaAssignments.areaId })
    .from(driverAreaAssignments)
    .where(and(eq(driverAreaAssignments.driverId, driverId), eq(driverAreaAssignments.date, date)));
  const existingIds = new Set(existing.map((row) => row.areaId));
  const wantedIds = new Set(areaIds);

  const toRemove = [...existingIds].filter((id) => !wantedIds.has(id));
  const toAdd = [...wantedIds].filter((id) => !existingIds.has(id));

  if (toRemove.length) {
    await tx.delete(driverAreaAssignments).where(and(
      eq(driverAreaAssignments.driverId, driverId),
      eq(driverAreaAssignments.date, date),
      inArray(driverAreaAssignments.areaId, toRemove),
    ));
  }

  if (toAdd.length) {
    await tx.insert(driverAreaAssignments).values(
      toAdd.map((areaId) => ({ id: uuidv7(), driverId, date, areaId })),
    );
  }
});

import { and, asc, eq, ne, or, sql } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import { db } from "../../db/index.js";
import { httpError } from "../../utils/httpError.js";
import { workers } from "./worker.schema.js";
import { workerAreaOverride as dailyAssignments } from "./workerAreaOverride.schema.js";

// Reuse the existing date-specific table so saved dated assignments survive
// the switch. Weekly templates are deliberately never consulted.
const activeMarketer = sql`(${workers.status} = 'active' AND EXISTS (
  SELECT 1 FROM worker_roles wr WHERE wr.worker_id = ${workers.id} AND wr.role = 'marketer'
))`;

export const listDayAssignments = (date) => db
  .select({ workerId: workers.id, workerName: workers.name, canAssign: activeMarketer.mapWith(Boolean), areaId: dailyAssignments.areaId })
  .from(workers)
  .leftJoin(dailyAssignments, and(eq(dailyAssignments.workerId, workers.id), eq(dailyAssignments.date, date)))
  // Keep assigned inactive/former marketers visible so their area can be cleared.
  .where(or(activeMarketer, sql`${dailyAssignments.areaId} IS NOT NULL`))
  .orderBy(asc(workers.name));

export const getEffectiveArea = async (workerId, date) => {
  const [row] = await db.select({ areaId: dailyAssignments.areaId })
    .from(dailyAssignments)
    .innerJoin(workers, eq(workers.id, dailyAssignments.workerId))
    .where(and(eq(dailyAssignments.workerId, workerId), eq(dailyAssignments.date, date), activeMarketer));
  return row?.areaId ?? null;
};

export const setDailyAssignment = (workerId, date, areaId) => db.transaction(async (tx) => {
  // All assignment writers serialize per date, including clears. Lock BEFORE
  // reading conflicts: two admins cannot both see an area as available and save.
  await tx.execute(sql`SELECT pg_advisory_xact_lock(741203, (${date}::date - DATE '2000-01-01')::integer)`);

  if (areaId) {
    const [conflict] = await tx.select({ workerName: workers.name })
      .from(dailyAssignments)
      .innerJoin(workers, eq(workers.id, dailyAssignments.workerId))
      .where(and(eq(dailyAssignments.date, date), eq(dailyAssignments.areaId, areaId), ne(dailyAssignments.workerId, workerId)));
    if (conflict) {
      throw httpError(409, `${conflict.workerName} is already assigned to this area on ${date}`, "AREA_DOUBLE_BOOKED");
    }
    await tx.insert(dailyAssignments).values({ id: uuidv7(), workerId, date, areaId })
      .onConflictDoUpdate({ target: [dailyAssignments.workerId, dailyAssignments.date], set: { areaId, updatedAt: new Date() } });
  } else {
    await tx.delete(dailyAssignments).where(and(eq(dailyAssignments.workerId, workerId), eq(dailyAssignments.date, date)));
  }
});

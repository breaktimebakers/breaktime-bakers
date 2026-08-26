import { and, desc, eq } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import { db } from "../../db/index.js";
import { workerAttendance } from "./workerAttendance.schema.js";

const attendanceSelection = {
  id: workerAttendance.id,
  workerId: workerAttendance.workerId,
  date: workerAttendance.date,
  status: workerAttendance.status,
  overtimeHours: workerAttendance.overtimeHours,
  createdAt: workerAttendance.createdAt,
  updatedAt: workerAttendance.updatedAt,
};

export const listAttendanceByDate = async (date) => {
  return db.select(attendanceSelection).from(workerAttendance).where(eq(workerAttendance.date, date));
};

// No filter at all - every entry, across every worker and date. Same
// unscoped-list precedent as listWorkers/listAreas at this app's scale;
// Finance's salary/P&L aggregation needs an arbitrary and sometimes
// multi-month span of attendance in one shot (see useFinance.js), which
// a single date or month filter can't serve.
export const listAllAttendance = async () => {
  return db.select(attendanceSelection).from(workerAttendance);
};

export const listAttendanceForWorker = async (workerId) => {
  return db
    .select(attendanceSelection)
    .from(workerAttendance)
    .where(eq(workerAttendance.workerId, workerId))
    .orderBy(desc(workerAttendance.date));
};

const findEntry = async (workerId, date) => {
  const rows = await db
    .select(attendanceSelection)
    .from(workerAttendance)
    .where(and(eq(workerAttendance.workerId, workerId), eq(workerAttendance.date, date)));

  return rows[0];
};

// One entry per worker per day - the unique(workerId, date) constraint on
// worker_attendance is what makes this an upsert rather than a duplicate
// insert when attendance is marked again for the same day.
export const upsertAttendance = async (workerId, { date, status, overtimeHours }) => {
  await db
    .insert(workerAttendance)
    .values({ id: uuidv7(), workerId, date, status, overtimeHours })
    .onConflictDoUpdate({
      target: [workerAttendance.workerId, workerAttendance.date],
      set: { status, overtimeHours, updatedAt: new Date() },
    });

  return findEntry(workerId, date);
};

export const clearAttendance = async (workerId, date) => {
  await db
    .delete(workerAttendance)
    .where(and(eq(workerAttendance.workerId, workerId), eq(workerAttendance.date, date)));
};

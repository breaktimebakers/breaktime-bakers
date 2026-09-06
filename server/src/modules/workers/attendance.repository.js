import { and, count, desc, eq } from "drizzle-orm";
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

const buildWorkerAttendanceConditions = (workerId, { status } = {}) => {
  const conditions = [eq(workerAttendance.workerId, workerId)];

  if (status) conditions.push(eq(workerAttendance.status, status));

  return and(...conditions);
};

// Called with no second argument (or {}), this stays byte-for-byte
// identical to its pre-pagination behavior - the worker detail page's
// calendar and payroll estimate both rely on that, see attendance.service.js.
export const listAttendanceForWorker = async (workerId, { status, page, pageSize = 10 } = {}) => {
  const statement = db
    .select(attendanceSelection)
    .from(workerAttendance)
    .where(buildWorkerAttendanceConditions(workerId, { status }))
    // A unique tie-breaker prevents equal dates moving between pages.
    .orderBy(desc(workerAttendance.date), desc(workerAttendance.id));

  if (page !== undefined) {
    return statement.limit(pageSize).offset((page - 1) * pageSize);
  }

  return statement;
};

export const countAttendanceForWorker = async (workerId, { status } = {}) => {
  const [result] = await db
    .select({ total: count() })
    .from(workerAttendance)
    .where(buildWorkerAttendanceConditions(workerId, { status }));

  return result.total;
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

import { and, desc, eq, gte, lte } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import { db } from "../../db/index.js";
import { workerAdvances } from "./advance.schema.js";

const advanceSelection = {
  id: workerAdvances.id,
  workerId: workerAdvances.workerId,
  date: workerAdvances.date,
  amount: workerAdvances.amount,
  note: workerAdvances.note,
  createdAt: workerAdvances.createdAt,
  updatedAt: workerAdvances.updatedAt,
};

// No filter at all - every advance, across every worker. Same
// unscoped-list precedent as listAllAttendance; the Finance Salary page's
// running Paid/Unpaid totals need every worker's advances across every
// month in one shot.
export const listAllAdvances = async () => {
  return db.select(advanceSelection).from(workerAdvances).orderBy(desc(workerAdvances.date));
};

export const listAdvancesInRange = async (from, to, workerId) => {
  const conditions = [gte(workerAdvances.date, from), lte(workerAdvances.date, to)];
  if (workerId) conditions.push(eq(workerAdvances.workerId, workerId));

  return db
    .select(advanceSelection)
    .from(workerAdvances)
    .where(and(...conditions))
    .orderBy(desc(workerAdvances.date));
};

export const listAdvancesForWorker = async (workerId) => {
  return db
    .select(advanceSelection)
    .from(workerAdvances)
    .where(eq(workerAdvances.workerId, workerId))
    .orderBy(desc(workerAdvances.date));
};

export const createAdvance = async ({ workerId, date, amount, note }) => {
  const id = uuidv7();

  await db.insert(workerAdvances).values({ id, workerId, date, amount, note: note || null });

  const rows = await db.select(advanceSelection).from(workerAdvances).where(eq(workerAdvances.id, id));
  return rows[0];
};

export const deleteAdvance = async (id) => {
  await db.delete(workerAdvances).where(eq(workerAdvances.id, id));
};

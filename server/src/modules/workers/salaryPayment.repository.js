import { and, eq } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import { db } from "../../db/index.js";
import { workerSalaryPayments } from "./salaryPayment.schema.js";

const paymentSelection = {
  id: workerSalaryPayments.id,
  workerId: workerSalaryPayments.workerId,
  year: workerSalaryPayments.year,
  month: workerSalaryPayments.month,
  amountPaid: workerSalaryPayments.amountPaid,
  paidDate: workerSalaryPayments.paidDate,
  createdAt: workerSalaryPayments.createdAt,
};

// No filter at all - every settlement record, across every worker and
// month. The Finance Salary page's running Paid/Unpaid totals need to
// know, for every worker and every past month, whether it was ever
// marked paid - that's inherently a full-table read, same as
// listAllAttendance/listAllAdvances.
export const listAllPayments = async () => {
  return db.select(paymentSelection).from(workerSalaryPayments);
};

const upsertOne = async (tx, { workerId, year, month, amountPaid }) => {
  const todayStr = new Date().toISOString().slice(0, 10);

  await tx
    .insert(workerSalaryPayments)
    .values({ id: uuidv7(), workerId, year, month, amountPaid, paidDate: todayStr })
    .onConflictDoUpdate({
      target: [workerSalaryPayments.workerId, workerSalaryPayments.year, workerSalaryPayments.month],
      set: { amountPaid, paidDate: todayStr },
    });
};

export const markPaid = async ({ workerId, year, month, amountPaid }) => {
  await upsertOne(db, { workerId, year, month, amountPaid });

  const rows = await db
    .select(paymentSelection)
    .from(workerSalaryPayments)
    .where(
      and(
        eq(workerSalaryPayments.workerId, workerId),
        eq(workerSalaryPayments.year, year),
        eq(workerSalaryPayments.month, month),
      ),
    );

  return rows[0];
};

export const bulkMarkPaid = async (payments) => {
  await db.transaction(async (tx) => {
    for (const payment of payments) {
      await upsertOne(tx, payment);
    }
  });
};

export const markUnpaid = async (workerId, year, month) => {
  await db
    .delete(workerSalaryPayments)
    .where(
      and(
        eq(workerSalaryPayments.workerId, workerId),
        eq(workerSalaryPayments.year, year),
        eq(workerSalaryPayments.month, month),
      ),
    );
};

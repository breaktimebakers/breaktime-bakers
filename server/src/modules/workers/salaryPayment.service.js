import { httpError } from "../../utils/httpError.js";
import { todayIso } from "../../utils/dateRange.js";
import * as salaryPaymentRepo from "./salaryPayment.repository.js";
import * as workerRepo from "./worker.repository.js";
import * as attendanceRepo from "./attendance.repository.js";
import * as advanceRepo from "./advance.repository.js";
import {
  calculateWorkerPayroll,
  monthBounds,
  monthsSinceJoining,
  workerWasEmployedInMonth,
} from "./payroll.js";

const money = (value) => Math.round((value + Number.EPSILON) * 100) / 100;
const workerMonthKey = (workerId, year, month) => workerId + ":" + year + ":" + month;
const dateMonthKey = (workerId, date) => workerId + ":" + date.slice(0, 7);

const requireWorker = async (workerId) => {
  const worker = await workerRepo.findWorkerById(workerId);
  if (!worker) throw httpError(404, "Worker not found");
  return worker;
};

const currentPeriod = () => {
  const [year, month] = todayIso().split("-").map(Number);
  return { year, month: month - 1 };
};

const requirePayablePeriod = (worker, year, month) => {
  const current = currentPeriod();
  if (year > current.year || (year === current.year && month > current.month)) {
    throw httpError(400, "A future month's salary cannot be marked paid", "FUTURE_SALARY_PERIOD");
  }
  if (!workerWasEmployedInMonth(worker, year, month)) {
    throw httpError(400, "Worker was not employed in this salary period", "OUTSIDE_EMPLOYMENT_PERIOD");
  }
};

const groupByWorker = (rows) => {
  const grouped = new Map();
  for (const row of rows) {
    if (!grouped.has(row.workerId)) grouped.set(row.workerId, []);
    grouped.get(row.workerId).push(row);
  }
  return grouped;
};

const groupByWorkerMonth = (rows) => {
  const grouped = new Map();
  for (const row of rows) {
    const key = dateMonthKey(row.workerId, row.date);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(row);
  }
  return grouped;
};

const payrollRow = (worker, attendance, advances, year, month, payment) => ({
  worker: {
    id: worker.id,
    name: worker.name,
    roles: worker.roles,
    status: worker.status,
    joiningDate: worker.joiningDate,
    leftDate: worker.leftDate,
    monthlySalary: worker.monthlySalary,
    overtimeRate: worker.overtimeRate,
    weekOffDay: worker.weekOffDay,
  },
  ...calculateWorkerPayroll(worker, attendance, advances, year, month, payment),
});

const calculateAllTimeUnpaid = async (workers) => {
  const [attendance, advances, payments] = await Promise.all([
    attendanceRepo.listAllAttendance(),
    advanceRepo.listAllAdvances(),
    salaryPaymentRepo.listAllPayments(),
  ]);
  const attendanceByMonth = groupByWorkerMonth(attendance);
  const advancesByMonth = groupByWorkerMonth(advances);
  const paymentsByMonth = new Map(
    payments.map((payment) => [workerMonthKey(payment.workerId, payment.year, payment.month), payment]),
  );
  const current = currentPeriod();
  let total = 0;

  for (const worker of workers) {
    for (const period of monthsSinceJoining(worker, current.year, current.month)) {
      const paymentKey = workerMonthKey(worker.id, period.year, period.month);
      if (paymentsByMonth.has(paymentKey)) continue;
      const monthLabel = String(period.month + 1).padStart(2, "0");
      const dataKey = worker.id + ":" + period.year + "-" + monthLabel;
      const calculation = calculateWorkerPayroll(
        worker,
        attendanceByMonth.get(dataKey) || [],
        advancesByMonth.get(dataKey) || [],
        period.year,
        period.month,
      );
      total += calculation.netPayable;
    }
  }

  return money(total);
};

export const listPayments = async () => salaryPaymentRepo.listAllPayments();

export const getPayroll = async ({ year, month, includeLeft }) => {
  const { from, to } = monthBounds(year, month);
  const [workers, attendance, advances, payments] = await Promise.all([
    workerRepo.listWorkers(),
    attendanceRepo.listAttendanceInRange(from, to),
    advanceRepo.listAdvancesInRange(from, to),
    salaryPaymentRepo.listPaymentsForMonth(year, month),
  ]);
  const attendanceByWorker = groupByWorker(attendance);
  const advancesByWorker = groupByWorker(advances);
  const paymentByWorker = new Map(payments.map((payment) => [payment.workerId, payment]));
  const visibleWorkers = workers.filter((worker) => (
    workerWasEmployedInMonth(worker, year, month) && (includeLeft || worker.status === "active")
  ));
  const rows = visibleWorkers.map((worker) => payrollRow(
    worker,
    attendanceByWorker.get(worker.id) || [],
    advancesByWorker.get(worker.id) || [],
    year,
    month,
    paymentByWorker.get(worker.id),
  ));
  const [totalUnpaid] = await Promise.all([calculateAllTimeUnpaid(workers)]);
  const totalPaid = money(
    advances.reduce((sum, entry) => sum + Number(entry.amount), 0)
      + payments.reduce((sum, payment) => sum + Number(payment.amountPaid), 0),
  );

  return {
    year,
    month,
    rows,
    summary: {
      totalNetPayable: money(rows.reduce((sum, row) => sum + row.netPayable, 0)),
      totalPaid,
      totalUnpaid,
    },
  };
};

const calculateAmountDue = async (worker, year, month) => {
  const { from, to } = monthBounds(year, month);
  const [attendance, advances] = await Promise.all([
    attendanceRepo.listAttendanceInRange(from, to, worker.id),
    advanceRepo.listAdvancesInRange(from, to, worker.id),
  ]);
  return calculateWorkerPayroll(worker, attendance, advances, year, month).netPayable;
};

export const markPaid = async ({ workerId, year, month }) => {
  const worker = await requireWorker(workerId);
  requirePayablePeriod(worker, year, month);
  const amountPaid = await calculateAmountDue(worker, year, month);
  return salaryPaymentRepo.markPaid({ workerId, year, month, amountPaid });
};

export const bulkMarkPaid = async ({ workerIds, year, month }) => {
  const workers = await Promise.all(workerIds.map(requireWorker));
  workers.forEach((worker) => requirePayablePeriod(worker, year, month));
  const { from, to } = monthBounds(year, month);
  const [attendance, advances] = await Promise.all([
    attendanceRepo.listAttendanceInRange(from, to),
    advanceRepo.listAdvancesInRange(from, to),
  ]);
  const attendanceByWorker = groupByWorker(attendance);
  const advancesByWorker = groupByWorker(advances);
  const payments = workers.map((worker) => ({
    workerId: worker.id,
    year,
    month,
    amountPaid: calculateWorkerPayroll(
      worker,
      attendanceByWorker.get(worker.id) || [],
      advancesByWorker.get(worker.id) || [],
      year,
      month,
    ).netPayable,
  }));
  await salaryPaymentRepo.bulkMarkPaid(payments);
};

export const markUnpaid = async (workerId, year, month) => {
  await requireWorker(workerId);
  await salaryPaymentRepo.markUnpaid(workerId, year, month);
};

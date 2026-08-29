import { httpError } from "../../utils/httpError.js";
import * as salaryPaymentRepo from "./salaryPayment.repository.js";
import * as workerRepo from "./worker.repository.js";

const requireWorker = async (workerId) => {
  const worker = await workerRepo.findWorkerById(workerId);

  if (!worker) {
    throw httpError(404, "Worker not found");
  }
};

export const listPayments = async () => salaryPaymentRepo.listAllPayments();

export const markPaid = async ({ workerId, year, month, amountPaid }) => {
  await requireWorker(workerId);

  return salaryPaymentRepo.markPaid({ workerId, year, month, amountPaid });
};

export const bulkMarkPaid = async (payments) => {
  await Promise.all(payments.map((p) => requireWorker(p.workerId)));

  await salaryPaymentRepo.bulkMarkPaid(payments);
};

export const markUnpaid = async (workerId, year, month) => {
  await requireWorker(workerId);

  await salaryPaymentRepo.markUnpaid(workerId, year, month);
};

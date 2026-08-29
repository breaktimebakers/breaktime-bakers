import { httpError } from "../../utils/httpError.js";
import * as advanceRepo from "./advance.repository.js";
import * as workerRepo from "./worker.repository.js";

const requireWorker = async (workerId) => {
  const worker = await workerRepo.findWorkerById(workerId);

  if (!worker) {
    throw httpError(404, "Worker not found");
  }
};

export const listAdvances = async ({ workerId }) => {
  if (workerId) {
    await requireWorker(workerId);
    return advanceRepo.listAdvancesForWorker(workerId);
  }

  return advanceRepo.listAllAdvances();
};

export const createAdvance = async ({ workerId, date, amount, note }) => {
  await requireWorker(workerId);

  return advanceRepo.createAdvance({ workerId, date, amount, note });
};

export const deleteAdvance = async (id) => {
  await advanceRepo.deleteAdvance(id);
};

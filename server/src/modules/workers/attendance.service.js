import { httpError } from "../../utils/httpError.js";
import * as attendanceRepo from "./attendance.repository.js";
import * as workerRepo from "./worker.repository.js";

const requireWorker = async (workerId) => {
  const worker = await workerRepo.findWorkerById(workerId);

  if (!worker) {
    throw httpError(404, "Worker not found");
  }
};

export const listAttendance = async ({ date, workerId }) => {
  if (workerId) {
    await requireWorker(workerId);
    return attendanceRepo.listAttendanceForWorker(workerId);
  }

  if (date) return attendanceRepo.listAttendanceByDate(date);

  return attendanceRepo.listAllAttendance();
};

export const markAttendance = async ({ workerId, date, status, overtimeHours }) => {
  await requireWorker(workerId);

  return attendanceRepo.upsertAttendance(workerId, { date, status, overtimeHours });
};

export const clearAttendance = async (workerId, date) => {
  await requireWorker(workerId);

  await attendanceRepo.clearAttendance(workerId, date);
};

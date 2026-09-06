import { httpError } from "../../utils/httpError.js";
import { resolvePagination } from "../../utils/pagination.js";
import * as attendanceRepo from "./attendance.repository.js";
import * as workerRepo from "./worker.repository.js";

const requireWorker = async (workerId) => {
  const worker = await workerRepo.findWorkerById(workerId);

  if (!worker) {
    throw httpError(404, "Worker not found");
  }
};

export const listAttendance = async ({ date, workerId, status, page, pageSize }) => {
  if (workerId) {
    await requireWorker(workerId);

    // No status filter here, matching today's exact unpaginated behavior -
    // the worker detail page's calendar/payroll estimate call this path
    // with no page and must keep seeing every entry, unfiltered.
    if (page === undefined) {
      return { attendance: await attendanceRepo.listAttendanceForWorker(workerId) };
    }

    const [totalItems, attendance] = await Promise.all([
      attendanceRepo.countAttendanceForWorker(workerId, { status }),
      attendanceRepo.listAttendanceForWorker(workerId, { status, page, pageSize }),
    ]);
    const pagination = resolvePagination(totalItems, { page, pageSize });

    return { attendance, pagination };
  }

  if (date) return { attendance: await attendanceRepo.listAttendanceByDate(date) };

  return { attendance: await attendanceRepo.listAllAttendance() };
};

export const markAttendance = async ({ workerId, date, status, overtimeHours }) => {
  await requireWorker(workerId);

  return attendanceRepo.upsertAttendance(workerId, { date, status, overtimeHours });
};

export const clearAttendance = async (workerId, date) => {
  await requireWorker(workerId);

  await attendanceRepo.clearAttendance(workerId, date);
};

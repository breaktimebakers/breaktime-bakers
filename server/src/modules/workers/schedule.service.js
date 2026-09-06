import { httpError } from "../../utils/httpError.js";
import { todayIso } from "../../utils/dateRange.js";
import * as scheduleRepo from "./schedule.repository.js";
import * as workerRepo from "./worker.repository.js";
import * as areaRepo from "../sales/area.repository.js";

export const getDaySchedule = async (requestedDate) => {
  const date = requestedDate || todayIso();
  return { date, assignments: await scheduleRepo.listDayAssignments(date) };
};

export const getTodayAssignments = () => getDaySchedule();

// Kept as the order-creation service's entry point; only this exact date
// is eligible. No assignment means the worker cannot take orders today.
export const getEffectiveAreaForWorker = (workerId, date) => scheduleRepo.getEffectiveArea(workerId, date);

export const setDailyAssignment = async (workerId, date, areaId) => {
  const worker = await workerRepo.findWorkerById(workerId);
  if (!worker) throw httpError(404, "Order taker not found");

  if (areaId) {
    if (worker.status !== "active" || !worker.roles.includes("marketer")) {
      throw httpError(400, "Only active marketers can be assigned an area", "NOT_ACTIVE_MARKETER");
    }
    const area = await areaRepo.findAreaById(areaId);
    if (!area || area.isArchived) throw httpError(404, "Area not found");
  }

  await scheduleRepo.setDailyAssignment(workerId, date, areaId);
  return { workerId, date, areaId };
};

import { httpError } from "../../utils/httpError.js";
import { todayIso } from "../../utils/dateRange.js";
import * as scheduleRepo from "./schedule.repository.js";
import * as workerRepo from "../workers/worker.repository.js";
import * as areaRepo from "../sales/area.repository.js";

export const getDaySchedule = async (requestedDate) => {
  const date = requestedDate || todayIso();
  return { date, assignments: await scheduleRepo.listDayAssignments(date) };
};

export const getTodaySchedule = () => getDaySchedule();

export const setDriverDayAreas = async (driverId, date, areaIds) => {
  const worker = await workerRepo.findWorkerById(driverId);
  if (!worker) throw httpError(404, "Driver not found");

  // Only enforced when actually assigning something - clearing an
  // inactive/former driver's areas down to none must still be possible,
  // same reasoning as the order-taker marketer check.
  if (areaIds.length) {
    if (worker.status !== "active" || !worker.roles.includes("delivery")) {
      throw httpError(400, "Only active delivery workers can be assigned areas", "NOT_ACTIVE_DRIVER");
    }

    const foundAreas = await Promise.all(areaIds.map((id) => areaRepo.findAreaById(id)));
    foundAreas.forEach((area, index) => {
      if (!area || area.isArchived) throw httpError(404, `Area ${areaIds[index]} not found`);
    });
  }

  await scheduleRepo.setDriverDayAreas(driverId, date, areaIds);
  return { driverId, date, areaIds };
};

import { httpError } from "../../utils/httpError.js";
import { todayIso, currentWeekRange } from "../../utils/dateRange.js";
import * as scheduleRepo from "./schedule.repository.js";
import * as workerRepo from "./worker.repository.js";
import * as areaRepo from "../sales/area.repository.js";

const { WEEK_DAYS, weekdayOf } = scheduleRepo;

const requireMarketerWorker = async (workerId) => {
  const worker = await workerRepo.findWorkerById(workerId);

  if (!worker) {
    throw httpError(404, "Order taker not found");
  }

  if (!worker.roles.includes("marketer")) {
    throw httpError(400, "Selected worker is not a marketer", "NOT_A_MARKETER");
  }

  return worker;
};

const requireActiveArea = async (areaId) => {
  const area = await areaRepo.findAreaById(areaId);

  if (!area || area.isArchived) {
    throw httpError(404, "Area not found");
  }

  return area;
};

const addDaysIso = (dateIso, n) => {
  const d = new Date(dateIso);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

const datesOfWeek = (weekStart) => Array.from({ length: 7 }, (_, i) => addDaysIso(weekStart, i));

export const getWeekSchedule = async (weekStartParam) => {
  const weekStart = weekStartParam || currentWeekRange().from;
  const dates = datesOfWeek(weekStart);

  const marketers = await scheduleRepo.listActiveMarketers();
  const workerIds = marketers.map((w) => w.id);

  const templates = await scheduleRepo.getTemplatesForWorkers(workerIds);
  const overrides = await scheduleRepo.getOverridesForWorkersInDates(workerIds, dates);

  const workersOut = marketers.map((w) => {
    const template = Object.fromEntries(WEEK_DAYS.map((d) => [d, null]));
    templates.filter((t) => t.workerId === w.id).forEach((t) => (template[t.weekday] = t.areaId));

    const overrideByDate = Object.fromEntries(
      overrides.filter((o) => o.workerId === w.id).map((o) => [o.date, o.areaId]),
    );

    const days = dates.map((date) => {
      const weekday = weekdayOf(date);
      const isOverride = Object.prototype.hasOwnProperty.call(overrideByDate, date);
      const areaId = isOverride ? overrideByDate[date] : template[weekday];
      return { date, weekday, areaId, isOverride };
    });

    return { workerId: w.id, workerName: w.name, template, days };
  });

  return { weekStart, dates, workers: workersOut };
};

export const getTodayAssignments = async () => {
  const date = todayIso();
  const marketers = await scheduleRepo.listActiveMarketers();

  const assignments = await Promise.all(
    marketers.map(async (w) => ({
      workerId: w.id,
      areaId: await scheduleRepo.getEffectiveArea(w.id, date),
    })),
  );

  return { date, assignments };
};

export const getEffectiveAreaForWorker = (workerId, date) => scheduleRepo.getEffectiveArea(workerId, date);

export const saveWeeklyTemplate = async (workerId, days) => {
  await requireMarketerWorker(workerId);

  const assignedAreaIds = [...new Set(Object.values(days).filter(Boolean))];
  for (const areaId of assignedAreaIds) {
    await requireActiveArea(areaId);
  }

  for (const [weekday, areaId] of Object.entries(days)) {
    if (!areaId) continue;

    const conflict = await scheduleRepo.findTemplateConflict(workerId, weekday, areaId);
    if (conflict) {
      throw httpError(
        409,
        `${conflict.workerName} is already scheduled in this area every ${weekday}`,
        "AREA_DOUBLE_BOOKED",
      );
    }
  }

  await scheduleRepo.replaceTemplateForWorker(workerId, days);

  return { workerId, days };
};

const findEffectiveConflictOnDate = async (excludeWorkerId, date, areaId) => {
  const marketers = await scheduleRepo.listActiveMarketers();

  for (const w of marketers) {
    if (w.id === excludeWorkerId) continue;

    const effective = await scheduleRepo.getEffectiveArea(w.id, date);
    if (effective === areaId) return w;
  }

  return null;
};

export const setOverride = async (workerId, date, areaId) => {
  await requireMarketerWorker(workerId);

  const { from, to } = currentWeekRange();
  if (date < from || date > to) {
    throw httpError(400, "Schedule overrides can only be set for the current week", "OUTSIDE_CURRENT_WEEK");
  }

  if (areaId) {
    await requireActiveArea(areaId);

    const conflict = await findEffectiveConflictOnDate(workerId, date, areaId);
    if (conflict) {
      throw httpError(409, `${conflict.name} is already scheduled in this area on this date`, "AREA_DOUBLE_BOOKED");
    }
  }

  await scheduleRepo.setOverrideForDate(workerId, date, areaId);

  return { workerId, date, areaId };
};

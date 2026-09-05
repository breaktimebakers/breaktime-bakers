import { and, eq, inArray, ne } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import { db } from "../../db/index.js";
import { workers } from "./worker.schema.js";
import { workerRoles } from "./workerRole.schema.js";
import { workerWeeklyArea } from "./workerWeeklyArea.schema.js";
import { workerAreaOverride } from "./workerAreaOverride.schema.js";

export const WEEK_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const weekdayOf = (dateStr) => WEEK_DAYS[new Date(dateStr).getDay()];

export const listActiveMarketers = async () => {
  return db
    .select({ id: workers.id, name: workers.name })
    .from(workers)
    .innerJoin(workerRoles, eq(workerRoles.workerId, workers.id))
    .where(and(eq(workerRoles.role, "marketer"), eq(workers.status, "active")));
};

export const getTemplatesForWorkers = async (workerIds) => {
  if (!workerIds.length) return [];
  return db
    .select({ workerId: workerWeeklyArea.workerId, weekday: workerWeeklyArea.weekday, areaId: workerWeeklyArea.areaId })
    .from(workerWeeklyArea)
    .where(inArray(workerWeeklyArea.workerId, workerIds));
};

export const getOverridesForWorkersInDates = async (workerIds, dates) => {
  if (!workerIds.length || !dates.length) return [];
  return db
    .select({ workerId: workerAreaOverride.workerId, date: workerAreaOverride.date, areaId: workerAreaOverride.areaId })
    .from(workerAreaOverride)
    .where(and(inArray(workerAreaOverride.workerId, workerIds), inArray(workerAreaOverride.date, dates)));
};

// Override for this exact date, if one exists - the value that wins over
// the weekly default when present.
export const getOverrideForDate = async (workerId, date) => {
  const rows = await db
    .select({ areaId: workerAreaOverride.areaId })
    .from(workerAreaOverride)
    .where(and(eq(workerAreaOverride.workerId, workerId), eq(workerAreaOverride.date, date)));

  return rows[0];
};

const getTemplateForWeekday = async (workerId, weekday) => {
  const rows = await db
    .select({ areaId: workerWeeklyArea.areaId })
    .from(workerWeeklyArea)
    .where(and(eq(workerWeeklyArea.workerId, workerId), eq(workerWeeklyArea.weekday, weekday)));

  return rows[0];
};

// Override if one exists for this date, else the weekly default for that
// weekday, else null (not scheduled anywhere that day).
export const getEffectiveArea = async (workerId, date) => {
  const override = await getOverrideForDate(workerId, date);
  if (override) return override.areaId;

  const template = await getTemplateForWeekday(workerId, weekdayOf(date));
  return template?.areaId ?? null;
};

// Another marketer already covering this weekday+area in the recurring
// template - checked when saving a template row, ignoring the worker
// being saved.
export const findTemplateConflict = async (excludeWorkerId, weekday, areaId) => {
  const rows = await db
    .select({ workerId: workerWeeklyArea.workerId, workerName: workers.name })
    .from(workerWeeklyArea)
    .innerJoin(workers, eq(workers.id, workerWeeklyArea.workerId))
    .where(
      and(
        eq(workerWeeklyArea.weekday, weekday),
        eq(workerWeeklyArea.areaId, areaId),
        ne(workerWeeklyArea.workerId, excludeWorkerId),
      ),
    );

  return rows[0];
};

// Full replace, not incremental - same "toggle a set, save" shape as
// worker.repository.js#replaceRoles. `days` is a { weekday: areaId|null }
// map covering all 7 weekdays.
export const replaceTemplateForWorker = async (workerId, days) => {
  await db.transaction(async (tx) => {
    await tx.delete(workerWeeklyArea).where(eq(workerWeeklyArea.workerId, workerId));

    const rows = Object.entries(days)
      .filter(([, areaId]) => areaId)
      .map(([weekday, areaId]) => ({ id: uuidv7(), workerId, weekday, areaId }));

    if (rows.length) {
      await tx.insert(workerWeeklyArea).values(rows);
    }
  });
};

// Upsert-or-clear for one date. A null areaId deletes the override row
// entirely (reverting that date back to the weekly default) rather than
// storing an explicit null, since "no override" and "override to nothing"
// would otherwise be indistinguishable from a plain SELECT.
export const setOverrideForDate = async (workerId, date, areaId) => {
  await db.transaction(async (tx) => {
    await tx
      .delete(workerAreaOverride)
      .where(and(eq(workerAreaOverride.workerId, workerId), eq(workerAreaOverride.date, date)));

    if (areaId) {
      await tx.insert(workerAreaOverride).values({ id: uuidv7(), workerId, date, areaId });
    }
  });
};

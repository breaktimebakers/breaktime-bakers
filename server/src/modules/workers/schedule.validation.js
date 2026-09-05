import { z } from "zod";
import { WEEK_DAYS } from "./schedule.repository.js";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

export const workerIdParamSchema = z.object({
  workerId: z.string().min(1),
});

export const weekQuerySchema = z.object({
  weekStart: isoDate.optional(),
});

// Full replace, all 7 weekdays required explicitly (a day omitted from
// the object would be ambiguous - "leave as-is" or "clear it" - so the
// client always sends the complete week).
export const saveWeeklyTemplateSchema = z.object({
  days: z
    .record(z.enum(WEEK_DAYS), z.string().min(1).nullable())
    .refine((obj) => WEEK_DAYS.every((d) => d in obj), { message: "All 7 weekdays are required" }),
});

export const setOverrideSchema = z.object({
  date: isoDate,
  areaId: z.string().min(1).nullable(),
});

import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");
const isoTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Expected HH:MM");

const ROLES = ["chef", "labour", "delivery", "marketer"];
const WEEK_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const workerIdParamSchema = z.object({
  id: z.string().min(1),
});

export const createWorkerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  address: z.string().trim().max(500).optional(),
  phone: z.string().trim().max(20).optional(),
  aadhaarNumber: z.string().trim().max(20).optional(),
  // nullish, not just optional: omitted means "leave the current photo
  // alone" (see worker.repository.js#updateWorker), explicit null means
  // "clear it" - a plain .optional() would reject that null outright.
  photoKey: z.string().trim().max(500).nullish(),
  joiningDate: isoDate,
  roles: z.array(z.enum(ROLES)).default([]),
  monthlySalary: z.coerce.number().nonnegative(),
  overtimeRate: z.coerce.number().nonnegative().default(0),
  shiftStart: isoTime,
  shiftEnd: isoTime,
  weekOffDay: z.enum(WEEK_DAYS),
});

export const updateWorkerSchema = createWorkerSchema;

export const updateWorkerAreasSchema = z.object({
  areaIds: z.array(z.string().min(1)).default([]),
});

import { z } from "zod";
import { isoDateSchema as isoDate } from "../../utils/isoDate.js";
import { paginationQueryShape } from "../../utils/pagination.js";

const isoTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Expected HH:MM");

const ROLES = ["chef", "labour", "delivery", "marketer"];
const WEEK_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const workerIdParamSchema = z.object({
  id: z.string().min(1),
});

// A query-string array can arrive either as one repeated key (Express/qs
// parses that natively into an array) or, from apiClient's plain
// URLSearchParams.set(key, arrayValue), as a single comma-joined string -
// normalize both into a string[] before validating each entry against ROLES.
const rolesQuerySchema = z
  .union([z.string(), z.array(z.string())])
  .transform((val) => (Array.isArray(val) ? val : val.split(",")).map((r) => r.trim()).filter(Boolean))
  .pipe(z.array(z.enum(ROLES)))
  .optional();

export const listWorkersQuerySchema = z.object({
  ...paginationQueryShape,
  search: z.string().trim().optional(),
  status: z.enum(["all", "active", "left"]).optional().default("all"),
  roles: rolesQuerySchema,
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

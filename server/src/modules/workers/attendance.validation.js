import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

export const listAttendanceQuerySchema = z.object({
  date: isoDate.optional(),
  workerId: z.string().min(1).optional(),
});

export const markAttendanceSchema = z.object({
  workerId: z.string().min(1),
  date: isoDate,
  // "week_off" swaps this worker's off day for the week this date falls
  // in - see AttendanceCalendar.jsx (client) for how that suppresses the
  // default weekOffDay for the rest of that week.
  status: z.enum(["present", "absent", "half_day", "week_off"]),
  overtimeHours: z.coerce.number().nonnegative().default(0),
});

export const clearAttendanceParamSchema = z.object({
  workerId: z.string().min(1),
  date: isoDate,
});

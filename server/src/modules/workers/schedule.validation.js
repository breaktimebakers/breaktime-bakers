import { z } from "zod";
import { isoDateSchema as isoDate } from "../../utils/isoDate.js";

export const workerIdParamSchema = z.object({ workerId: z.string().min(1) });
export const dayQuerySchema = z.object({ date: isoDate.optional() });
export const dailyAssignmentSchema = z.object({
  date: isoDate,
  areaId: z.string().min(1).nullable(),
});

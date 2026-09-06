import { z } from "zod";
import { isoDateSchema as isoDate } from "../../utils/isoDate.js";

export const driverIdParamSchema = z.object({ driverId: z.string().min(1) });

export const dayQuerySchema = z.object({ date: isoDate.optional() });

export const setDriverAreasSchema = z.object({
  date: isoDate,
  areaIds: z.array(z.string().min(1)).default([]),
});

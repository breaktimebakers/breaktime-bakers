import { z } from "zod";
import { isoDateSchema as isoDate } from "../../utils/isoDate.js";

export const driverIdParamSchema = z.object({ id: z.string().min(1) });

export const dayQuerySchema = z.object({ date: isoDate.optional() });

// Only 7 or 30 - matches the order-taker detail page's chart toggle.
export const statsQuerySchema = z.object({
  range: z.coerce.number().refine((n) => n === 7 || n === 30, "range must be 7 or 30").optional().default(7),
});

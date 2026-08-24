import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

// Same shape/semantics as batch.validation.js's listBatchesQuerySchema.
// The filter picks WHICH products appear (did this product have any
// stock movement in the window?) - the qty/value shown for each is
// always its true, all-time current stock, never window-scoped. See
// resolveDateRange usage in readyStock.service.js.
export const listReadyStockQuerySchema = z.object({
  filter: z.enum(["today", "week", "custom", "all"]).optional().default("today"),
  from: isoDate.optional(),
  to: isoDate.optional(),
});

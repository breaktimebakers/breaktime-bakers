import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

// Same shape/semantics as batch.validation.js's listBatchesQuerySchema.
// The filter picks WHICH products appear (did this product have any
// stock movement in the window?). Quantity shown is always the true,
// all-time current stock, never window-scoped - but price IS scoped to
// `to`: the price on the most recent production batch as of that date,
// not today's live price. See readyStock.repository.js: priceAsOfSql.
export const listReadyStockQuerySchema = z.object({
  filter: z.enum(["today", "week", "custom", "all"]).optional().default("today"),
  from: isoDate.optional(),
  to: isoDate.optional(),
});

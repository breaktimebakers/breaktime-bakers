import { z } from "zod";
import { isoDateSchema as isoDate, withDateRangeCheck } from "../../utils/isoDate.js";

// Same shape/semantics as batch.validation.js's listBatchesQuerySchema.
// The filter picks WHICH products appear (did this product have any
// stock movement in the window?). Quantity shown is always the true,
// all-time current stock, never window-scoped - but price IS scoped to
// `to`: the price on the most recent production batch as of that date,
// not today's live price. See readyStock.repository.js: priceAsOfSql.
export const listReadyStockQuerySchema = withDateRangeCheck(
  z.object({
    filter: z.enum(["today", "week", "custom", "all"]).optional().default("today"),
    from: isoDate.optional(),
    to: isoDate.optional(),
  }),
);

export const productIdParamSchema = z.object({
  id: z.string().min(1),
});

// from/to default to the current calendar month when both are omitted -
// see resolveMonthRange in readyStock.service.js. Same shape as
// rawMaterial.validation.js's listLotsQuerySchema.
export const listStockHistoryQuerySchema = withDateRangeCheck(
  z.object({
    from: isoDate.optional(),
    to: isoDate.optional(),
  }),
);

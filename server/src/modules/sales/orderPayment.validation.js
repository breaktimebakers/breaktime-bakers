import { z } from "zod";
import { isoDateSchema as isoDate, withDateRangeCheck } from "../../utils/isoDate.js";

// Bounds match order_payments.amount's numeric(12, 2) column, same idiom
// as fulfillItemLineSchema's quantity bounds in order.validation.js.
export const recordPaymentSchema = z.object({
  orderId: z.string().min(1),
  amount: z.coerce.number().positive("Amount must be greater than 0").max(9999999999.99, "Amount is too large"),
  collectedBy: z.string().min(1).optional(),
  paymentDate: isoDate.optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const listForOrderQuerySchema = z.object({
  orderId: z.string().min(1),
});

export const storeIdParamSchema = z.object({
  storeId: z.string().min(1),
});

export const areaIdParamSchema = z.object({
  areaId: z.string().min(1),
});

export const areaStoreSummariesQuerySchema = withDateRangeCheck(
  z.object({
    filter: z.enum(["today", "week", "custom", "all"]).optional().default("all"),
    from: isoDate.optional(),
    to: isoDate.optional(),
  }),
);

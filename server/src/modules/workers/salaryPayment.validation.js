import { z } from "zod";

const paymentEntry = z.object({
  workerId: z.string().min(1),
  year: z.coerce.number().int(),
  month: z.coerce.number().int().min(0).max(11),
  amountPaid: z.coerce.number().nonnegative(),
});

export const markPaidSchema = paymentEntry;

export const bulkMarkPaidSchema = z.object({
  payments: z.array(paymentEntry).min(1),
});

export const unmarkParamSchema = z.object({
  workerId: z.string().min(1),
  year: z.coerce.number().int(),
  month: z.coerce.number().int().min(0).max(11),
});

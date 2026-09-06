import { z } from "zod";

const paymentPeriod = {
  year: z.coerce.number().int().min(2000).max(9999),
  month: z.coerce.number().int().min(0).max(11),
};

export const payrollQuerySchema = z.object({
  ...paymentPeriod,
  includeLeft: z.enum(["true", "false"]).optional().default("false").transform((value) => value === "true"),
});

export const markPaidSchema = z.object({
  workerId: z.string().min(1),
  ...paymentPeriod,
});

export const bulkMarkPaidSchema = z.object({
  workerIds: z.array(z.string().min(1)).min(1),
  ...paymentPeriod,
}).refine((body) => new Set(body.workerIds).size === body.workerIds.length, {
  message: "Each worker can only appear once",
  path: ["workerIds"],
});

export const unmarkParamSchema = z.object({
  workerId: z.string().min(1),
  ...paymentPeriod,
});

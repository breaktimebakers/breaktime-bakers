import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

export const listAdvanceQuerySchema = z.object({
  workerId: z.string().min(1).optional(),
});

export const createAdvanceSchema = z.object({
  workerId: z.string().min(1),
  date: isoDate,
  amount: z.coerce.number().positive(),
  note: z.string().trim().max(500).optional(),
});

export const advanceIdParamSchema = z.object({
  id: z.string().min(1),
});

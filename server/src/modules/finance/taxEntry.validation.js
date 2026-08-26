import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

export const taxEntryIdParamSchema = z.object({
  id: z.string().min(1),
});

export const createTaxEntrySchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  date: isoDate,
  note: z.string().trim().max(500).optional(),
  billKey: z.string().trim().max(500).optional(),
});

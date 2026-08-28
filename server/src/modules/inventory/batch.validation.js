import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

// filter defaults to "today" - see resolveBatchDateRange in
// batch.service.js. "custom" uses from/to as-is; "week"/"all" are
// available but never the default, since the list would otherwise grow
// unbounded (or at least noisy) as production accumulates over time.
export const listBatchesQuerySchema = z.object({
  filter: z.enum(["today", "week", "custom", "all"]).optional().default("today"),
  from: isoDate.optional(),
  to: isoDate.optional(),
});

export const batchIdParamSchema = z.object({
  id: z.string().min(1),
});

const ingredientLineSchema = z.object({
  rawMaterialId: z.string().min(1),
  qty: z.coerce.number().positive("Quantity must be greater than 0"),
});

export const createBatchSchema = z.object({
  productName: z.string().trim().min(1, "Product name is required").max(150),
  quantityProduced: z.coerce.number().positive("Quantity produced must be greater than 0"),
  unit: z.string().trim().min(1, "Unit is required").max(20),
  pricePerUnit: z.coerce.number().positive("Selling price per unit is required"),
  producedAt: isoDate.optional(),
  ingredients: z
    .array(ingredientLineSchema)
    .default([])
    .refine((lines) => new Set(lines.map((l) => l.rawMaterialId)).size === lines.length, {
      message: "Each raw material can only appear once - combine quantities into a single line",
    }),
});

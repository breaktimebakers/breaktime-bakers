import { z } from "zod";
import { isoDateSchema as isoDate, withDateRangeCheck } from "../../utils/isoDate.js";

export const listRawMaterialsQuerySchema = withDateRangeCheck(
  z.object({
    search: z.string().trim().min(1).optional(),
    filter: z.enum(["all", "low", "custom"]).optional().default("all"),
    from: isoDate.optional(),
    to: isoDate.optional(),
  }),
);

export const rawMaterialIdParamSchema = z.object({
  id: z.string().min(1),
});

export const createRawMaterialSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  unit: z.string().trim().min(1, "Unit is required").max(20),
  lowStockAt: z.coerce.number().nonnegative(),
  openingQty: z.coerce.number().positive("Opening quantity must be greater than 0"),
  openingRate: z.coerce.number().nonnegative(),
  vendor: z.string().trim().max(150).optional(),
  purchaseDate: isoDate,
  receiptKey: z.string().trim().max(500).optional(),
});

export const updateRawMaterialSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  unit: z.string().trim().min(1, "Unit is required").max(20),
  lowStockAt: z.coerce.number().nonnegative(),
});

// from/to default to the current calendar month when both are omitted -
// see resolveMonthRange in rawMaterial.service.js. inStock bypasses that
// default entirely (see listLotsForMaterial) - it's for the wastage
// lot-picker, which needs every lot with remaining stock regardless of
// purchase date.
export const listLotsQuerySchema = withDateRangeCheck(
  z.object({
    from: isoDate.optional(),
    to: isoDate.optional(),
    inStock: z.coerce.boolean().optional(),
  }),
);

export const createLotSchema = z.object({
  qty: z.coerce.number().positive("Quantity must be greater than 0"),
  rate: z.coerce.number().nonnegative(),
  vendor: z.string().trim().max(150).optional(),
  purchaseDate: isoDate,
  receiptKey: z.string().trim().max(500).optional(),
});

export const lotWastageParamSchema = z.object({
  id: z.string().min(1),
  lotId: z.string().min(1),
});

export const createWastageSchema = z.object({
  qty: z.coerce.number().positive("Quantity must be greater than 0"),
  date: isoDate,
  note: z.string().trim().max(500).optional(),
});

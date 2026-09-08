import { z } from "zod";
import { isoDateSchema as isoDate } from "../../utils/isoDate.js";

export const walkInSaleIdParamSchema = z.object({
  id: z.string().min(1),
});

export const createWalkInSaleSchema = z
  .object({
    productId: z.string().min(1),
    // Bounds match ready_stock_movements/order_items' numeric(12, 3) column.
    quantity: z.coerce
      .number()
      .positive("Quantity must be greater than 0")
      .max(999999999.999, "Quantity is too large")
      .refine((v) => Math.abs(v * 1000 - Math.round(v * 1000)) < 1e-6, {
        message: "Quantity supports at most 3 decimal places",
      }),
    amount: z.coerce.number().positive("Amount must be greater than 0"),
    paymentStatus: z.enum(["paid", "partial"]).optional().default("paid"),
    // Only meaningful when paymentStatus is "partial" - ignored otherwise,
    // the service always sets amountPaid = amount for a "paid" sale.
    amountPaid: z.coerce.number().nonnegative("Amount paid cannot be negative").optional(),
    saleDate: isoDate,
  })
  .refine((body) => body.paymentStatus !== "partial" || body.amountPaid !== undefined, {
    message: "Amount paid is required for a partial payment",
    path: ["amountPaid"],
  })
  .refine((body) => body.paymentStatus !== "partial" || body.amountPaid < body.amount, {
    message: "Amount paid must be less than the total amount for a partial payment",
    path: ["amountPaid"],
  });

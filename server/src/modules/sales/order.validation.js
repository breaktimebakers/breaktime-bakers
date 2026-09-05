import { z } from "zod";
import { paginationQueryShape } from "../../utils/pagination.js";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

const ORDER_STATUSES = ["in_transit", "shipped", "delivered"];

// filter defaults to "today" - matches the app's requirement that the
// Orders pages show only today's orders unless the admin asks for more,
// same "default to today" idiom as listBatchesQuerySchema.
export const listOrdersQuerySchema = z.object({
  ...paginationQueryShape,
  search: z.string().trim().max(200).optional(),
  sortKey: z.enum(["otName", "storeName", "areaName", "productsLabel", "totalQty", "status", "orderDate"]).optional().default("orderDate"),
  sortDir: z.enum(["asc", "desc"]).optional().default("desc"),
  filter: z.enum(["today", "week", "custom", "all"]).optional().default("today"),
  from: isoDate.optional(),
  to: isoDate.optional(),
  areaId: z.string().min(1).optional(),
  storeId: z.string().min(1).optional(),
  status: z.enum(["all", "undelivered", "delivered"]).optional().default("all"),
  orderTakerId: z.string().min(1).optional(),
  productId: z.string().min(1).optional(),
});

export const orderIdParamSchema = z.object({
  id: z.string().min(1),
});

const orderItemLineSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
});

export const createOrderSchema = z.object({
  storeId: z.string().min(1),
  orderTakerId: z.string().min(1),
  notes: z.string().trim().max(1000).optional(),
  items: z
    .array(orderItemLineSchema)
    .min(1, "At least one product is required")
    .refine((lines) => new Set(lines.map((l) => l.productId)).size === lines.length, {
      message: "Each product can only appear once - combine quantities into a single line",
    }),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

const fulfillItemLineSchema = z.object({
  itemId: z.string().min(1),
  fulfilledQty: z.coerce.number().nonnegative(),
});

export const fulfillOrderSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  fulfillmentDate: isoDate.optional(),
  notes: z.string().trim().max(1000).optional(),
  items: z.array(fulfillItemLineSchema).min(1, "At least one item is required"),
});

import { z } from "zod";
import { paginationQueryShape } from "../../utils/pagination.js";
import { isoDateSchema as isoDate, withDateRangeCheck } from "../../utils/isoDate.js";

const ORDER_STATUSES = ["in_transit", "shipped", "delivered"];

// filter defaults to "today" - matches the app's requirement that the
// Orders pages show only today's orders unless the admin asks for more,
// same "default to today" idiom as listBatchesQuerySchema.
export const listOrdersQuerySchema = withDateRangeCheck(
  z.object({
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
  }),
);

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

// "delivered" is deliberately excluded here - it also requires a
// fulfillment date and per-item fulfilledQty, which this endpoint doesn't
// carry. That transition only happens through PATCH /:id/fulfill.
export const updateOrderStatusSchema = z.object({
  status: z.enum(["in_transit", "shipped"]),
});

const fulfillItemLineSchema = z.object({
  itemId: z.string().min(1),
  // Bounds match order_items' numeric(12, 3) column - reject what the DB
  // would otherwise silently round or overflow on.
  fulfilledQty: z.coerce
    .number()
    .nonnegative("Fulfilled quantity cannot be negative")
    .max(999999999.999, "Fulfilled quantity is too large")
    .refine((v) => Math.abs(v * 1000 - Math.round(v * 1000)) < 1e-6, {
      message: "Fulfilled quantity supports at most 3 decimal places",
    }),
});

export const fulfillOrderSchema = z
  .object({
    status: z.enum(ORDER_STATUSES),
    fulfillmentDate: isoDate.optional(),
    notes: z.string().trim().max(1000).optional(),
    // Every order item must be represented exactly once - a fulfillment
    // request is a full snapshot of the order's fulfillment state, not a
    // patch to a subset of lines. Matches what FillOrderModal already
    // sends; matching against the real order (unknown/duplicate/missing
    // items) happens in the service, which has the order's actual items.
    items: z
      .array(fulfillItemLineSchema)
      .min(1, "At least one item is required")
      .refine((lines) => new Set(lines.map((l) => l.itemId)).size === lines.length, {
        message: "Each item can only appear once in a fulfillment request",
      }),
  })
  .refine((body) => body.status !== "delivered" || Boolean(body.fulfillmentDate), {
    message: "Fulfillment date is required when marking an order delivered",
    path: ["fulfillmentDate"],
  });

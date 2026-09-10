import { z } from "zod";

// Keep in sync with client/src/features/sales/constants/visitReasons.js -
// the client renders labels for these same codes.
export const VISIT_REASON_CODES = [
  "STORE_CLOSED",
  "OWNER_UNAVAILABLE",
  "COME_LATER",
  "NO_ORDER_REQUIRED",
  "STOCK_AVAILABLE",
  "VISIT_SKIPPED",
  "OTHER",
];

// visitDate isn't accepted from the client - the service always stamps
// today's date (Asia/Kolkata), same reasoning as createOrder always using
// today for the area-schedule check this shares.
export const createStoreVisitNoteSchema = z
  .object({
    storeId: z.string().min(1),
    orderTakerId: z.string().min(1),
    reasonCode: z.enum(VISIT_REASON_CODES),
    note: z.string().trim().max(500, "Note is too long").optional(),
  })
  .refine((body) => body.reasonCode !== "OTHER" || (body.note && body.note.length > 0), {
    message: "A note is required when the reason is \"Other\"",
    path: ["note"],
  });

// Same filter/from/to convention as listOrdersQuerySchema, so the Orders
// page can drive both queries off one shared date-filter state.
export const listStoreVisitNotesQuerySchema = z.object({
  orderTakerId: z.string().min(1).optional(),
  storeId: z.string().min(1).optional(),
  filter: z.enum(["today", "week", "custom", "all"]).optional().default("today"),
  from: z.string().min(1).optional(),
  to: z.string().min(1).optional(),
});

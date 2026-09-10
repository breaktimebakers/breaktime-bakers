import { z } from "zod";
import { paginationQueryShape } from "../../utils/pagination.js";
import { isoDateSchema as isoDate, withDateRangeCheck } from "../../utils/isoDate.js";

export const deliveryStatusQuerySchema = withDateRangeCheck(
  z.object({
    // page left optional (no default) - omitting it entirely returns every
    // matching row unpaginated, which is what export uses (see
    // listDeliveryStatus in status.service.js and listOrders's identical
    // pattern in order.repository.js).
    ...paginationQueryShape,
    // "all" - no date bound at all, unlike the default ("custom"), which
    // falls back to today when the client doesn't supply an explicit
    // range - see listDeliveryStatus in status.service.js.
    filter: z.enum(["custom", "all"]).optional().default("custom"),
    from: isoDate.optional(),
    to: isoDate.optional(),
    areaId: z.string().min(1).optional(),
    driverId: z.string().min(1).optional(),
    status: z.enum(["all", "delivered", "partial", "pending", "no_orders"]).optional().default("all"),
    search: z.string().trim().max(200).optional(),
  }),
);

import { z } from "zod";
import { paginationQueryShape } from "../../utils/pagination.js";
import { isoDateSchema as isoDate, withDateRangeCheck } from "../../utils/isoDate.js";

export const deliveryStatusQuerySchema = withDateRangeCheck(
  z.object({
    page: z.coerce.number().int().min(1).max(2147483647).default(1),
    pageSize: paginationQueryShape.pageSize,
    from: isoDate.optional(),
    to: isoDate.optional(),
    areaId: z.string().min(1).optional(),
    driverId: z.string().min(1).optional(),
    status: z.enum(["all", "delivered", "partial", "pending", "no_orders"]).optional().default("all"),
    search: z.string().trim().max(200).optional(),
  }),
);

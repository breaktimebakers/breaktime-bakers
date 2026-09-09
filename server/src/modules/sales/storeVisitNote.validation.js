import { z } from "zod";

// visitDate isn't accepted from the client - the service always stamps
// today's date (Asia/Kolkata), same reasoning as createOrder always using
// today for the area-schedule check this shares.
export const createStoreVisitNoteSchema = z.object({
  storeId: z.string().min(1),
  orderTakerId: z.string().min(1),
  reason: z.string().trim().min(1, "Reason is required").max(500, "Reason is too long"),
});

export const listStoreVisitNotesQuerySchema = z.object({
  orderTakerId: z.string().min(1).optional(),
  storeId: z.string().min(1).optional(),
});

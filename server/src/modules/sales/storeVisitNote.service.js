import { todayIso, resolveDateRange } from "../../utils/dateRange.js";
import * as storeVisitNoteRepo from "./storeVisitNote.repository.js";
import { requireStore, requireMarketerWorker, requireScheduledForStoreToday } from "./order.service.js";

export const listStoreVisitNotes = ({ orderTakerId, storeId, ...rangeQuery }) =>
  storeVisitNoteRepo.listStoreVisitNotes({ orderTakerId, storeId, ...resolveDateRange(rangeQuery) });

// Same gating as createOrder - a closed-store visit can only be logged for
// a store the order taker is actually scheduled to today, so this can't be
// used to backdate or claim a visit to a store outside their area.
export const createStoreVisitNote = async (body) => {
  const store = await requireStore(body.storeId);
  await requireMarketerWorker(body.orderTakerId);
  await requireScheduledForStoreToday(body.orderTakerId, store);

  return storeVisitNoteRepo.createStoreVisitNote({ ...body, visitDate: todayIso() });
};

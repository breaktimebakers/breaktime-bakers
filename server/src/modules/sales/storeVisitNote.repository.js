import { and, desc, eq, gte, lte } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import { db } from "../../db/index.js";
import { httpError } from "../../utils/httpError.js";
import { isUniqueViolation } from "../../utils/dbErrors.js";
import { storeVisitNotes } from "./storeVisitNote.schema.js";
import { stores } from "./store.schema.js";

const selection = {
  id: storeVisitNotes.id,
  storeId: storeVisitNotes.storeId,
  storeName: stores.dealerName,
  orderTakerId: storeVisitNotes.orderTakerId,
  visitDate: storeVisitNotes.visitDate,
  reasonCode: storeVisitNotes.reasonCode,
  note: storeVisitNotes.note,
  createdAt: storeVisitNotes.createdAt,
};

const withStoreJoin = (qb) => qb.from(storeVisitNotes).innerJoin(stores, eq(storeVisitNotes.storeId, stores.id));

export const listStoreVisitNotes = async ({ orderTakerId, storeId, from, to } = {}) => {
  const conditions = [];
  if (orderTakerId) conditions.push(eq(storeVisitNotes.orderTakerId, orderTakerId));
  if (storeId) conditions.push(eq(storeVisitNotes.storeId, storeId));
  if (from) conditions.push(gte(storeVisitNotes.visitDate, from));
  if (to) conditions.push(lte(storeVisitNotes.visitDate, to));

  return withStoreJoin(db.select(selection))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(storeVisitNotes.visitDate), desc(storeVisitNotes.createdAt));
};

// Unique(storeId, visitDate) means a second attempt to mark the same
// store closed on the same day is a real conflict (someone already
// recorded it, possibly a different order taker) rather than data to
// silently overwrite.
export const createStoreVisitNote = async ({ storeId, orderTakerId, visitDate, reasonCode, note }) => {
  const id = uuidv7();

  try {
    await db.insert(storeVisitNotes).values({ id, storeId, orderTakerId, visitDate, reasonCode, note: note || null });
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw httpError(409, "This store has already been marked closed for that date", "ALREADY_MARKED");
    }
    throw err;
  }

  const [row] = await withStoreJoin(db.select(selection)).where(eq(storeVisitNotes.id, id));
  return row;
};

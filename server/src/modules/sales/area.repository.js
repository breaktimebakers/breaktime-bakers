import { asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import { db } from "../../db/index.js";
import { httpError } from "../../utils/httpError.js";
import { isUniqueViolation } from "../../utils/dbErrors.js";
import { areas } from "./area.schema.js";
import { stores } from "./store.schema.js";

// Never stored - the "3 stores" badge on each Areas card is COUNT(*) at
// read time, so two admins adding stores to the same area at once can't
// leave a denormalized counter out of sync. Counts every store
// regardless of isActive - the badge is "how many dealers", not "how
// many are currently buying".
const storeCountSql = sql`COALESCE((
  SELECT COUNT(*)
  FROM stores s
  WHERE s.area_id = areas.id
), 0)`.mapWith(Number);

const areaSelection = {
  id: areas.id,
  name: areas.name,
  city: areas.city,
  pincode: areas.pincode,
  isArchived: areas.isArchived,
  createdAt: areas.createdAt,
  updatedAt: areas.updatedAt,
  storeCount: storeCountSql.as("store_count"),
};

export const listAreas = async () => {
  return db
    .select(areaSelection)
    .from(areas)
    .where(eq(areas.isArchived, false))
    .orderBy(asc(areas.name));
};

export const findAreaById = async (id) => {
  const rows = await db.select(areaSelection).from(areas).where(eq(areas.id, id));

  return rows[0];
};

export const createArea = async ({ name, city, pincode }) => {
  try {
    const id = uuidv7();
    await db.insert(areas).values({ id, name, city, pincode });
    return findAreaById(id);
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw httpError(409, "An area with this name already exists");
    }
    throw err;
  }
};

export const updateArea = async (id, { name, city, pincode }) => {
  try {
    const result = await db
      .update(areas)
      .set({ name, city, pincode, updatedAt: new Date() })
      .where(eq(areas.id, id))
      .returning({ id: areas.id });

    if (!result[0]) return undefined;
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw httpError(409, "An area with this name already exists");
    }
    throw err;
  }

  return findAreaById(id);
};

const storeSelection = {
  id: stores.id,
  areaId: stores.areaId,
  dealerName: stores.dealerName,
  shopName: stores.shopName,
  dealerPhone: stores.dealerPhone,
  storeType: stores.storeType,
  address: stores.address,
  lat: stores.lat,
  lng: stores.lng,
  isActive: stores.isActive,
  createdAt: stores.createdAt,
  updatedAt: stores.updatedAt,
};

export const listStoresForArea = async (areaId) => {
  return db
    .select(storeSelection)
    .from(stores)
    .where(eq(stores.areaId, areaId))
    .orderBy(asc(stores.dealerName));
};

// Every store, across every area - the Add Order picker needs a store
// list regardless of which area (or none) the modal was opened from,
// unlike the per-area list above which is lazy-loaded per Area Detail.
export const listAllStores = async () => {
  return db.select(storeSelection).from(stores).orderBy(asc(stores.dealerName));
};

export const findStoreById = async (id) => {
  const rows = await db.select(storeSelection).from(stores).where(eq(stores.id, id));

  return rows[0];
};

// Stores just removed from an area (or never assigned one) - the pool an
// admin picks from when populating a newly split-off area.
export const listUnassignedStores = async () => {
  return db
    .select(storeSelection)
    .from(stores)
    .where(isNull(stores.areaId))
    .orderBy(asc(stores.dealerName));
};

export const bulkAssignStores = async (storeIds, areaId) => {
  await db
    .update(stores)
    .set({ areaId, updatedAt: new Date() })
    .where(inArray(stores.id, storeIds));
};

export const bulkUnassignStores = async (storeIds) => {
  await db
    .update(stores)
    .set({ areaId: null, updatedAt: new Date() })
    .where(inArray(stores.id, storeIds));
};

export const createStoreForArea = async (areaId, body) => {
  const id = uuidv7();

  await db.insert(stores).values({
    id,
    areaId,
    dealerName: body.dealerName,
    shopName: body.shopName || null,
    dealerPhone: body.dealerPhone || null,
    storeType: body.storeType,
    address: body.address || null,
    lat: body.lat ?? null,
    lng: body.lng ?? null,
  });

  return findStoreById(id);
};

export const updateStore = async (id, body) => {
  const result = await db
    .update(stores)
    .set({
      dealerName: body.dealerName,
      shopName: body.shopName || null,
      dealerPhone: body.dealerPhone || null,
      storeType: body.storeType,
      address: body.address || null,
      lat: body.lat ?? null,
      lng: body.lng ?? null,
      updatedAt: new Date(),
    })
    .where(eq(stores.id, id))
    .returning({ id: stores.id });

  if (!result[0]) return undefined;

  return findStoreById(id);
};

export const updateStoreStatus = async (id, isActive) => {
  const result = await db
    .update(stores)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(stores.id, id))
    .returning({ id: stores.id });

  if (!result[0]) return undefined;

  return findStoreById(id);
};

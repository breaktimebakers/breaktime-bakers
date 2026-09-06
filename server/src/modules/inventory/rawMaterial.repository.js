import { and, asc, count, eq, gt, gte, ilike, lte, sql } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import { db } from "../../db/index.js";
import { httpError } from "../../utils/httpError.js";
import { isUniqueViolation } from "../../utils/dbErrors.js";
import { rawMaterials } from "./rawMaterial.schema.js";
import { materialLots } from "./materialLot.schema.js";
import { vendors } from "./vendor.schema.js";
import { materialLotWastages } from "./materialLotWastage.schema.js";
// Imported directly (not via the finance module's service/repository) so
// the expense insert below can share the same transaction as the lot
// decrement - atomicity here requires one db.transaction, not two
// sequential calls across modules.
import { expenses } from "../finance/expense.schema.js";

// pg returns numeric/aggregate results as strings by default; mapWith
// decodes the raw driver value with no null-guard of its own, so a
// missing next-lot-rate would come back as Number(null) === 0 instead of
// null without this.
const numberOrNull = (value) => (value === null || value === undefined ? null : Number(value));

// NOTE: interpolating ${table.column} into a `sql` template renders only
// the bare column name, never table-qualified - fine for a plain WHERE
// against the query's one table, but inside a correlated subquery it's
// ambiguous (or silently resolves to the SUBQUERY's own table instead of
// the outer row). These reference "raw_materials"."id" by hand for that
// reason - both tables are fixed, hand-authored identifiers here, never
// user input, so string interpolation of the names is safe.

// stockQty is never stored - it's SUM(remaining_qty) across a material's
// lots, computed at read time, so two admins restocking at once can't
// leave a denormalized counter out of sync.
const stockQtySql = sql`COALESCE((
  SELECT SUM(ml.remaining_qty)
  FROM material_lots ml
  WHERE ml.raw_material_id = raw_materials.id
), 0)`.mapWith(Number);

// The rate of the oldest lot that still has stock - the rate the next
// batch will actually be costed at under FIFO consumption. null once a
// material has no lots left with stock.
const nextLotRateSql = sql`(
  SELECT ml.unit_cost
  FROM material_lots ml
  WHERE ml.raw_material_id = raw_materials.id
    AND ml.remaining_qty > 0
  ORDER BY ml.purchase_date ASC
  LIMIT 1
)`.mapWith(numberOrNull);

const materialSelection = {
  id: rawMaterials.id,
  name: rawMaterials.name,
  unit: rawMaterials.unit,
  lowStockAt: rawMaterials.lowStockAt,
  isArchived: rawMaterials.isArchived,
  createdAt: rawMaterials.createdAt,
  updatedAt: rawMaterials.updatedAt,
  stockQty: stockQtySql.as("stock_qty"),
  nextLotRate: nextLotRateSql.as("next_lot_rate"),
};

// Treat LIKE wildcards as literal characters, matching the UI's substring
// search - same escaping as order.repository.js's search.
const escapeLikePattern = (value) => `%${value.replace(/[\\%_]/g, "\\$&")}%`;

const buildMaterialConditions = ({ search, filter, from, to } = {}) => {
  const conditions = [eq(rawMaterials.isArchived, false)];

  if (search) {
    conditions.push(ilike(rawMaterials.name, escapeLikePattern(search)));
  }

  if (filter === "custom" && (from || to)) {
    // "Purchased within this range" - true if any lot on the material
    // was bought in the window. Same qualification caveat as the
    // subqueries above - "raw_materials.id" is spelled out by hand.
    const fromClause = from ? sql`AND ml.purchase_date >= ${from}` : sql``;
    const toClause = to ? sql`AND ml.purchase_date <= ${to}` : sql``;

    conditions.push(sql`EXISTS (
      SELECT 1 FROM material_lots ml
      WHERE ml.raw_material_id = raw_materials.id
      ${fromClause}
      ${toClause}
    )`);
  }

  // stockQtySql/lowStockAt are both plain per-row values (a correlated
  // scalar subquery and a stored column), not aggregates - safe to
  // compare directly in WHERE, no HAVING/GROUP BY needed. This used to be
  // a post-fetch JS `.filter()`, which broke the moment pagination's
  // LIMIT/OFFSET was applied before that filter ran - a "low stock" page
  // 2 could silently omit or duplicate rows relative to what a plain,
  // unpaginated fetch showed.
  if (filter === "low") {
    conditions.push(sql`(${stockQtySql}) < ${rawMaterials.lowStockAt}`);
  }

  return conditions;
};

export const listRawMaterials = async ({ search, filter, from, to, page, pageSize = 10 } = {}) => {
  const statement = db
    .select(materialSelection)
    .from(rawMaterials)
    .where(and(...buildMaterialConditions({ search, filter, from, to })))
    // A unique tie-breaker prevents equal names moving between pages.
    .orderBy(asc(rawMaterials.name), asc(rawMaterials.id));

  if (page !== undefined) {
    return statement.limit(pageSize).offset((page - 1) * pageSize);
  }

  return statement;
};

export const countRawMaterials = async (query = {}) => {
  const [result] = await db
    .select({ total: count() })
    .from(rawMaterials)
    .where(and(...buildMaterialConditions(query)));

  return result.total;
};

// Sum of every matching material's current stock value (stockQty *
// nextLotRate), independent of pagination - the "Total raw material
// amount" summary and the PDF/Excel export both need this to reflect the
// whole filtered set, not just whatever page the table is currently on.
export const getRawMaterialsTotalValue = async (query = {}) => {
  const [result] = await db
    .select({ total: sql`COALESCE(SUM((${stockQtySql}) * COALESCE((${nextLotRateSql}), 0)), 0)`.mapWith(Number) })
    .from(rawMaterials)
    .where(and(...buildMaterialConditions(query)));

  return result.total;
};

export const findRawMaterialById = async (id) => {
  const rows = await db.select(materialSelection).from(rawMaterials).where(eq(rawMaterials.id, id));

  return rows[0];
};

const upsertVendorByName = async (tx, name) => {
  const trimmed = name?.trim();
  if (!trimmed) return null;

  const existing = await tx.select({ id: vendors.id }).from(vendors).where(eq(vendors.name, trimmed));
  if (existing[0]) return existing[0].id;

  try {
    const id = uuidv7();
    await tx.insert(vendors).values({ id, name: trimmed });
    return id;
  } catch (err) {
    // Lost a race with another admin creating the same vendor - use theirs.
    if (isUniqueViolation(err)) {
      const retry = await tx.select({ id: vendors.id }).from(vendors).where(eq(vendors.name, trimmed));
      if (retry[0]) return retry[0].id;
    }
    throw err;
  }
};

export const createRawMaterialWithOpeningLot = async ({
  name,
  unit,
  lowStockAt,
  openingQty,
  openingRate,
  vendor,
  purchaseDate,
  receiptKey,
}) => {
  const materialId = await db.transaction(async (tx) => {
    const existing = await tx.select({ id: rawMaterials.id }).from(rawMaterials).where(eq(rawMaterials.name, name));
    if (existing[0]) {
      throw httpError(409, "A raw material with this name already exists");
    }

    const id = uuidv7();
    await tx.insert(rawMaterials).values({ id, name, unit, lowStockAt });

    const vendorId = await upsertVendorByName(tx, vendor);

    await tx.insert(materialLots).values({
      id: uuidv7(),
      rawMaterialId: id,
      vendorId,
      originalQty: openingQty,
      remainingQty: openingQty,
      unitCost: openingRate,
      purchaseDate,
      receiptKey: receiptKey || null,
    });

    return id;
  });

  return findRawMaterialById(materialId);
};

export const updateRawMaterial = async (id, { name, unit, lowStockAt }) => {
  try {
    const result = await db
      .update(rawMaterials)
      .set({ name, unit, lowStockAt, updatedAt: new Date() })
      .where(eq(rawMaterials.id, id))
      .returning({ id: rawMaterials.id });

    if (!result[0]) return undefined;
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw httpError(409, "A raw material with this name already exists");
    }
    throw err;
  }

  return findRawMaterialById(id);
};

export const archiveRawMaterial = async (id) => {
  const result = await db
    .update(rawMaterials)
    .set({ isArchived: true, updatedAt: new Date() })
    .where(eq(rawMaterials.id, id))
    .returning({ id: rawMaterials.id });

  return result[0];
};

const lotSelection = {
  id: materialLots.id,
  rawMaterialId: materialLots.rawMaterialId,
  vendorId: materialLots.vendorId,
  vendorName: vendors.name,
  originalQty: materialLots.originalQty,
  remainingQty: materialLots.remainingQty,
  unitCost: materialLots.unitCost,
  purchaseDate: materialLots.purchaseDate,
  receiptKey: materialLots.receiptKey,
  createdAt: materialLots.createdAt,
};

// Oldest-first, matching FIFO consumption order - this is also the order
// the "purchase history" UI shows lots in, with the oldest marked as
// "FIFO next". `inStock` is for the wastage lot-picker: it needs every lot
// that still has stock regardless of when it was purchased, so it
// deliberately ignores from/to rather than combining with them.
export const listLotsForMaterial = async (rawMaterialId, { from, to, inStock } = {}) => {
  const conditions = [eq(materialLots.rawMaterialId, rawMaterialId)];

  if (inStock) {
    conditions.push(gt(materialLots.remainingQty, 0));
  } else {
    if (from) conditions.push(gte(materialLots.purchaseDate, from));
    if (to) conditions.push(lte(materialLots.purchaseDate, to));
  }

  return db
    .select(lotSelection)
    .from(materialLots)
    .leftJoin(vendors, eq(materialLots.vendorId, vendors.id))
    .where(and(...conditions))
    .orderBy(asc(materialLots.purchaseDate));
};

export const findLotById = async (id) => {
  const rows = await db
    .select(lotSelection)
    .from(materialLots)
    .leftJoin(vendors, eq(materialLots.vendorId, vendors.id))
    .where(eq(materialLots.id, id));

  return rows[0];
};

export const createLotForMaterial = async (rawMaterialId, { qty, rate, vendor, purchaseDate, receiptKey }) => {
  const lotId = await db.transaction(async (tx) => {
    const vendorId = await upsertVendorByName(tx, vendor);

    const id = uuidv7();
    await tx.insert(materialLots).values({
      id,
      rawMaterialId,
      vendorId,
      originalQty: qty,
      remainingQty: qty,
      unitCost: rate,
      purchaseDate,
      receiptKey: receiptKey || null,
    });

    return id;
  });

  return findLotById(lotId);
};

// Removes `qty` from one specific lot (spoilage/rats/expiry - the admin
// picks the exact lot, unlike FIFO batch consumption which picks for
// them) and logs the loss as a "Wastage / Loss" expense, atomically.
// `.for("update")` row-locks the lot for the rest of the transaction, same
// reasoning as consumeFifo in batch.repository.js - two admins can't both
// read the same remainingQty and jointly overdraw it.
export const createWastageForLot = async (lotId, { qty, date, note }) => {
  return db.transaction(async (tx) => {
    const [lot] = await tx
      .select({
        id: materialLots.id,
        rawMaterialId: materialLots.rawMaterialId,
        remainingQty: materialLots.remainingQty,
        unitCost: materialLots.unitCost,
      })
      .from(materialLots)
      .where(eq(materialLots.id, lotId))
      .for("update");

    if (!lot) {
      throw httpError(404, "Lot not found");
    }

    if (qty > lot.remainingQty) {
      throw httpError(422, "Quantity exceeds this lot's remaining stock");
    }

    await tx
      .update(materialLots)
      .set({ remainingQty: lot.remainingQty - qty })
      .where(eq(materialLots.id, lotId));

    const [material] = await tx
      .select({ name: rawMaterials.name, unit: rawMaterials.unit })
      .from(rawMaterials)
      .where(eq(rawMaterials.id, lot.rawMaterialId));

    const amount = qty * lot.unitCost;

    const expenseId = uuidv7();
    await tx.insert(expenses).values({
      id: expenseId,
      category: "Wastage / Loss",
      amount,
      date,
      note: note ? `${material.name}: ${note}` : `${material.name} — ${qty}${material.unit} spoiled`,
    });

    await tx.insert(materialLotWastages).values({
      id: uuidv7(),
      lotId,
      rawMaterialId: lot.rawMaterialId,
      expenseId,
      qty,
      costAtWastage: amount,
    });

    return lot.rawMaterialId;
  });
};

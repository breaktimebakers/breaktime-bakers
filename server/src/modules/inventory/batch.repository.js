import { and, asc, desc, eq, gt, gte, lte, sql } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import { db } from "../../db/index.js";
import { httpError } from "../../utils/httpError.js";
import { batches } from "./batch.schema.js";
import { batchLotConsumptions } from "./batchLotConsumption.schema.js";
import { materialLots } from "./materialLot.schema.js";
import { rawMaterials } from "./rawMaterial.schema.js";
import { readyStockMovements } from "./readyStockMovement.schema.js";
import { upsertProductByName } from "./product.repository.js";

// Ingredients consumed, aggregated per raw material (a single line can
// span multiple lots, but the caller only cares about the total qty per
// material, not which lots it came from).
const ingredientsUsedSql = sql`COALESCE((
  SELECT json_agg(json_build_object(
           'rawMaterialId', agg.raw_material_id,
           'rawMaterialName', agg.raw_material_name,
           'unit', agg.unit,
           'qty', agg.qty
         ) ORDER BY agg.raw_material_name)
  FROM (
    SELECT blc.raw_material_id,
           rm.name AS raw_material_name,
           rm.unit,
           SUM(blc.qty_consumed) AS qty
    FROM batch_lot_consumptions blc
    JOIN raw_materials rm ON rm.id = blc.raw_material_id
    WHERE blc.batch_id = batches.id
    GROUP BY blc.raw_material_id, rm.name, rm.unit
  ) agg
), '[]'::json)`;

const totalIngredientCostSql = sql`COALESCE((
  SELECT SUM(blc.cost_at_consumption)
  FROM batch_lot_consumptions blc
  WHERE blc.batch_id = batches.id
), 0)`.mapWith(Number);

const batchSelection = {
  id: batches.id,
  productName: batches.productName,
  quantityProduced: batches.quantityProduced,
  unit: batches.unit,
  pricePerUnit: batches.pricePerUnit,
  producedAt: batches.producedAt,
  createdAt: batches.createdAt,
  ingredientsUsed: ingredientsUsedSql,
  totalIngredientCost: totalIngredientCostSql,
};

const startOfDay = (isoDateStr) => new Date(`${isoDateStr}T00:00:00.000Z`);
const endOfDay = (isoDateStr) => new Date(`${isoDateStr}T23:59:59.999Z`);

export const listBatches = async ({ from, to } = {}) => {
  const conditions = [];

  if (from) conditions.push(gte(batches.producedAt, startOfDay(from)));
  if (to) conditions.push(lte(batches.producedAt, endOfDay(to)));

  return db
    .select(batchSelection)
    .from(batches)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(batches.producedAt));
};

export const findBatchById = async (id) => {
  const rows = await db.select(batchSelection).from(batches).where(eq(batches.id, id));

  return rows[0];
};

// Draws `qty` of one raw material out of its lots oldest-first, writing a
// consumption row per lot touched and decrementing remaining_qty as it
// goes. `.for("update")` row-locks the lots being read for the rest of
// the transaction, so two admins logging batches for the same material
// at the same moment can't both read the same remaining_qty and jointly
// overdraw it - the second transaction blocks until the first commits,
// then sees the already-decremented values.
const consumeFifo = async (tx, { batchId, rawMaterialId, qty }) => {
  const lots = await tx
    .select({
      id: materialLots.id,
      remainingQty: materialLots.remainingQty,
      unitCost: materialLots.unitCost,
    })
    .from(materialLots)
    .where(and(eq(materialLots.rawMaterialId, rawMaterialId), gt(materialLots.remainingQty, 0)))
    .orderBy(asc(materialLots.purchaseDate))
    .for("update");

  let remaining = qty;

  for (const lot of lots) {
    if (remaining <= 0) break;

    const drawn = Math.min(remaining, lot.remainingQty);

    await tx
      .update(materialLots)
      .set({ remainingQty: lot.remainingQty - drawn })
      .where(eq(materialLots.id, lot.id));

    await tx.insert(batchLotConsumptions).values({
      id: uuidv7(),
      batchId,
      lotId: lot.id,
      rawMaterialId,
      qtyConsumed: drawn,
      costAtConsumption: drawn * lot.unitCost,
    });

    remaining -= drawn;
  }

  if (remaining > 0) {
    const material = await tx
      .select({ name: rawMaterials.name })
      .from(rawMaterials)
      .where(eq(rawMaterials.id, rawMaterialId));

    throw httpError(
      409,
      `Not enough stock of ${material[0]?.name || "raw material"} - short by ${remaining}`,
      "INSUFFICIENT_STOCK",
    );
  }
};

export const createBatchWithConsumption = async ({
  productName,
  quantityProduced,
  unit,
  pricePerUnit,
  producedAt,
  ingredients,
}) => {
  const batchId = await db.transaction(async (tx) => {
    const id = uuidv7();
    const producedAtValue = producedAt ? startOfDay(producedAt) : new Date();

    await tx.insert(batches).values({
      id,
      productName,
      quantityProduced,
      unit,
      pricePerUnit: pricePerUnit ?? null,
      producedAt: producedAtValue,
    });

    // Sorted by rawMaterialId so every concurrent transaction locks
    // materials in the same order - two batches sharing ingredients but
    // listing them in different orders could otherwise deadlock each
    // other (A locks flour then waits on sugar, B locks sugar then waits
    // on flour). A consistent lock order rules that out.
    const sortedIngredients = [...ingredients].sort((a, b) => a.rawMaterialId.localeCompare(b.rawMaterialId));

    for (const line of sortedIngredients) {
      await consumeFifo(tx, { batchId: id, rawMaterialId: line.rawMaterialId, qty: line.qty });
    }

    // Ready Stock has no independent input in the UI - production is its
    // only source, so crediting it here (same transaction) keeps "batch
    // recorded, raw materials consumed, ready stock credited" atomic:
    // all three happen or none do.
    const productId = await upsertProductByName(tx, { name: productName, unit, pricePerUnit });

    await tx.insert(readyStockMovements).values({
      id: uuidv7(),
      productId,
      batchId: id,
      quantity: quantityProduced,
      reason: "production",
      occurredAt: producedAtValue,
    });

    return id;
  });

  return findBatchById(batchId);
};

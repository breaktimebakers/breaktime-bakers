// Backfills *today's* date-scoped rows on top of an already-seeded demo
// dataset (see seedDemoData.js). That script is idempotent per-section, not
// per-day - its attendance/driver-assignment/order/walk-in-sale loops only
// ever run once, generating a window of days relative to whenever it was
// last run. So a day that's passed since (like "today", whenever this
// script is run) never gets its own rows, and day-scoped views (Attendance
// calendar, today's Orders, Deliveries) show nothing for it.
//
// This script fills exactly that gap: today's worker attendance, driver
// area assignments, orders, and walk-in sales, for whatever workers/
// stores/products already exist. It does not create workers, stores, or
// products - run seedDemoData.js first if the base dataset isn't there yet.
//
// Idempotent: attendance and driver assignments rely on the tables' own
// unique(workerId/driverId, date[, areaId]) constraints via
// onConflictDoNothing; orders and walk-in sales skip themselves entirely
// if any row already exists for today's date, so re-running the same day
// is a no-op past the first run.
import { v7 as uuidv7 } from "uuid";
import { eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";

import { areas } from "../modules/sales/area.schema.js";
import { stores } from "../modules/sales/store.schema.js";
import { orders } from "../modules/sales/order.schema.js";
import { orderItems } from "../modules/sales/orderItem.schema.js";
import { walkInSales } from "../modules/sales/walkInSale.schema.js";

import { workers } from "../modules/workers/worker.schema.js";
import { workerRoles } from "../modules/workers/workerRole.schema.js";
import { workerAttendance } from "../modules/workers/workerAttendance.schema.js";
import { workerAreaOverride } from "../modules/workers/workerAreaOverride.schema.js";

import { driverAreaAssignments } from "../modules/delivery/driverAreaAssignment.schema.js";

import { products } from "../modules/inventory/product.schema.js";
import { readyStockMovements } from "../modules/inventory/readyStockMovement.schema.js";
import { batches } from "../modules/inventory/batch.schema.js";
import { rawMaterials } from "../modules/inventory/rawMaterial.schema.js";
import { createBatchWithConsumption } from "../modules/inventory/batch.repository.js";

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[randomInt(0, arr.length - 1)];
const chance = (p) => Math.random() < p;
const today = () => new Date().toISOString().slice(0, 10);

const CHUNK_SIZE = 400;
const insertChunked = async (table, rows, { onConflictDoNothing = false } = {}) => {
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const q = db.insert(table).values(rows.slice(i, i + CHUNK_SIZE));
    await (onConflictDoNothing ? q.onConflictDoNothing() : q);
  }
};

// ------------------------------------------------------------ attendance
const seedTodayAttendance = async (date) => {
  const allWorkers = await db.select({ id: workers.id }).from(workers);
  if (allWorkers.length === 0) {
    console.log("No workers found - skipping attendance");
    return;
  }

  const rows = allWorkers.map((w) => {
    const roll = Math.random();
    const status = roll < 0.85 ? "present" : roll < 0.95 ? "half_day" : "absent";
    return {
      id: uuidv7(),
      workerId: w.id,
      date,
      status,
      overtimeHours: status === "present" && chance(0.2) ? randomInt(1, 3) : 0,
    };
  });
  await insertChunked(workerAttendance, rows, { onConflictDoNothing: true });
  console.log(`Attendance: ${rows.length} workers processed for ${date} (existing entries left untouched)`);
};

// ---------------------------------------------------- driver assignments
const seedTodayDriverAssignments = async (date) => {
  const drivers = await db
    .select({ id: workers.id })
    .from(workers)
    .innerJoin(workerRoles, eq(workerRoles.workerId, workers.id))
    .where(eq(workerRoles.role, "delivery"));
  const areaRows = await db.select({ id: areas.id }).from(areas);
  if (drivers.length === 0 || areaRows.length === 0) {
    console.log("No drivers/areas found - skipping driver assignments");
    return;
  }

  const rows = [];
  for (const driver of drivers) {
    const areaCount = randomInt(1, 2);
    const chosen = new Set();
    while (chosen.size < areaCount) chosen.add(pick(areaRows).id);
    for (const areaId of chosen) rows.push({ id: uuidv7(), driverId: driver.id, date, areaId });
  }
  await insertChunked(driverAreaAssignments, rows, { onConflictDoNothing: true });
  console.log(`Driver assignments: ${drivers.length} drivers processed for ${date}`);
};

// -------------------------------------------------------------- orders
const ORDER_PROBABILITY_PER_STORE_PER_DAY = 0.4;

const seedTodayOrders = async (date) => {
  const existing = await db.select({ id: orders.id }).from(orders).where(eq(orders.orderDate, date)).limit(1);
  if (existing.length > 0) {
    console.log(`Skipping orders - some already exist for ${date}`);
    return;
  }

  const storeRows = await db.select({ id: stores.id, areaId: stores.areaId }).from(stores).where(eq(stores.isActive, true));
  const overrideRows = await db.select({ workerId: workerAreaOverride.workerId, areaId: workerAreaOverride.areaId }).from(workerAreaOverride);
  const marketerIdByArea = {};
  for (const r of overrideRows) if (r.areaId) marketerIdByArea[r.areaId] = r.workerId;

  const productRows = await db.select({ id: products.id }).from(products);
  if (storeRows.length === 0 || productRows.length === 0) {
    console.log("No stores/products found - skipping orders");
    return;
  }

  const orderRows = [];
  const itemRows = [];
  for (const store of storeRows) {
    const orderTakerId = store.areaId ? marketerIdByArea[store.areaId] : null;
    if (!orderTakerId) continue;
    if (!chance(ORDER_PROBABILITY_PER_STORE_PER_DAY)) continue;

    const lineCount = randomInt(1, 3);
    const chosenProducts = new Set();
    while (chosenProducts.size < lineCount) chosenProducts.add(pick(productRows).id);

    const orderId = uuidv7();
    orderRows.push({ id: orderId, storeId: store.id, orderTakerId, status: "in_transit", orderDate: date, fulfillmentDate: null, notes: null });
    for (const productId of chosenProducts) {
      itemRows.push({ id: uuidv7(), orderId, productId, quantity: randomInt(5, 40), fulfilledQty: 0 });
    }
  }

  await insertChunked(orders, orderRows);
  await insertChunked(orderItems, itemRows);
  console.log(`Created ${orderRows.length} orders (in_transit) with ${itemRows.length} line items for ${date}`);
};

// ------------------------------------------------------------- batches
// Same perUnit ingredient rates as seedDemoData.js's PRODUCT_DEFS - only
// materials that already exist are used, so this stays a no-op on a DB
// that hasn't been through seedDemoData.js.
const PRODUCT_DEFS = [
  { name: "Butter Croissants", unit: "pcs", basePrice: 35, perUnit: { "Maida (Refined Flour)": 0.075, Butter: 0.05, Milk: 0.05, Yeast: 0.0075 } },
  { name: "Milk Bread", unit: "loaves", basePrice: 45, perUnit: { "Maida (Refined Flour)": 0.1333, Milk: 0.1, Sugar: 0.0333, Yeast: 0.01 } },
  { name: "Cocoa Cookies", unit: "pcs", basePrice: 20, perUnit: { "Maida (Refined Flour)": 0.05, Sugar: 0.0333, Butter: 0.025, "Chocolate Chips": 0.0167 } },
  { name: "Dinner Buns", unit: "pcs", basePrice: 15, perUnit: { "Maida (Refined Flour)": 0.06, Milk: 0.04, Sugar: 0.01, Yeast: 0.006 } },
  { name: "Tea Cakes", unit: "pcs", basePrice: 60, perUnit: { "Maida (Refined Flour)": 0.08, Sugar: 0.06, Butter: 0.04, Milk: 0.04 } },
  { name: "Multigrain Bread", unit: "loaves", basePrice: 55, perUnit: { "Maida (Refined Flour)": 0.12, Sugar: 0.02, Yeast: 0.008, Milk: 0.05 } },
  { name: "Cheese Puffs", unit: "pcs", basePrice: 30, perUnit: { "Maida (Refined Flour)": 0.06, Butter: 0.03, Cheese: 0.08, "Baking Powder": 0.005 } },
  { name: "Rusk", unit: "packets", basePrice: 40, perUnit: { "Maida (Refined Flour)": 0.05, Sugar: 0.02, Butter: 0.01, "Baking Powder": 0.003 } },
];

const seedTodayBatches = async (date) => {
  const existing = await db
    .select({ id: batches.id })
    .from(batches)
    .where(sql`${batches.producedAt}::date = ${date}`)
    .limit(1);
  if (existing.length > 0) {
    console.log(`Skipping batches - some already exist for ${date}`);
    return;
  }

  const rawMaterialRows = await db.select({ id: rawMaterials.id, name: rawMaterials.name }).from(rawMaterials);
  const rawMaterialIdByName = Object.fromEntries(rawMaterialRows.map((r) => [r.name, r.id]));

  let batchCount = 0;
  for (const def of PRODUCT_DEFS) {
    const ingredientNames = Object.keys(def.perUnit).filter((name) => rawMaterialIdByName[name]);
    if (ingredientNames.length === 0) continue;

    const quantityProduced = randomInt(60, 200);
    const ingredients = ingredientNames.map((name) => ({
      rawMaterialId: rawMaterialIdByName[name],
      qty: Number((def.perUnit[name] * quantityProduced).toFixed(3)),
    }));
    const jitter = 1 + (Math.random() * 0.2 - 0.1);

    try {
      await createBatchWithConsumption({
        productName: def.name,
        quantityProduced,
        unit: def.unit,
        pricePerUnit: Math.round(def.basePrice * jitter),
        producedAt: date,
        ingredients,
      });
      batchCount++;
    } catch (err) {
      console.log(`Skipped producing ${def.name} - ${err.message}`);
    }
  }
  console.log(`Created ${batchCount} production batches for ${date}`);
};

// ---------------------------------------------------------- walk-in sales
const WALK_IN_ATTEMPTS = 25;

const seedTodayWalkInSales = async (date) => {
  const existing = await db.select({ id: walkInSales.id }).from(walkInSales).where(eq(walkInSales.saleDate, date)).limit(1);
  if (existing.length > 0) {
    console.log(`Skipping walk-in sales - some already exist for ${date}`);
    return;
  }

  const productRows = await db.select({ id: products.id, pricePerUnit: products.pricePerUnit }).from(products);
  if (productRows.length === 0) {
    console.log("No products found - skipping walk-in sales");
    return;
  }

  const ledger = {};
  for (const p of productRows) {
    const [{ available }] = await db
      .select({ available: sql`COALESCE(SUM(${readyStockMovements.quantity}), 0)`.mapWith(Number) })
      .from(readyStockMovements)
      .where(eq(readyStockMovements.productId, p.id));
    ledger[p.id] = available;
  }

  const rows = [];
  const movementRows = [];
  for (let i = 0; i < WALK_IN_ATTEMPTS; i++) {
    const product = pick(productRows);
    const quantity = randomInt(1, 8);
    if ((ledger[product.id] ?? 0) < quantity) continue;

    ledger[product.id] -= quantity;
    const basePrice = Number(product.pricePerUnit) || 30;
    const amount = Math.round(quantity * basePrice * (1 + (Math.random() * 0.2 - 0.1)));
    const isPartial = chance(0.25);
    const amountPaid = isPartial ? Math.round(amount * (0.3 + Math.random() * 0.5)) : amount;

    rows.push({ id: uuidv7(), productId: product.id, quantity, amount, paymentStatus: isPartial ? "partial" : "paid", amountPaid, saleDate: date });
    movementRows.push({ id: uuidv7(), productId: product.id, quantity: -quantity, reason: "sale", occurredAt: new Date(`${date}T15:00:00.000Z`) });
  }

  await insertChunked(walkInSales, rows);
  await insertChunked(readyStockMovements, movementRows);
  console.log(`Created ${rows.length} walk-in sales for ${date}`);
};

// ------------------------------------------------------------------ run
const run = async () => {
  const date = today();
  console.log(`Seeding today's data for ${date}...`);
  await seedTodayAttendance(date);
  await seedTodayDriverAssignments(date);
  await seedTodayOrders(date);
  await seedTodayBatches(date);
  await seedTodayWalkInSales(date);
  console.log("Done.");
  process.exit(0);
};

run().catch((err) => {
  console.error("Seeding today's data failed", err);
  process.exit(1);
});

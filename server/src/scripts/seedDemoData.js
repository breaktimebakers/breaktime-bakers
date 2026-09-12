// Seeds a large, internally-consistent demo dataset across every module
// wired to the real backend - deliberately sized to stress the UI at
// something like the real target scale (200+ stores), not just enough
// rows to prove a page renders. Everything here goes through the real
// FIFO/stock-ledger rules the app itself enforces (batches draw down raw
// material lots via the real consumeFifo path; orders/walk-in sales are
// only marked "delivered"/"paid" against a running ready-stock ledger
// tracked in this script, so nothing here can oversell a product the way
// a naive random-data generator could).
//
// Idempotent the same coarse way as the module it replaced: each section
// skips itself if its own target data already looks present, so a
// partial/interrupted run can be safely re-run, but it will NOT keep
// growing a dataset that's already been seeded once.
//
// Client-side local/mock data (finance's seedFinance.js customer
// payments, sales' seedSales.js) is deliberately left alone - those
// features have no backend yet, so there's nothing here for them to seed.
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v7 as uuidv7 } from "uuid";
import { eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { env } from "../config/env.js";

import { areas } from "../modules/sales/area.schema.js";
import { stores } from "../modules/sales/store.schema.js";
import { orders } from "../modules/sales/order.schema.js";
import { orderItems } from "../modules/sales/orderItem.schema.js";
import { walkInSales } from "../modules/sales/walkInSale.schema.js";

import { workers } from "../modules/workers/worker.schema.js";
import { workerRoles } from "../modules/workers/workerRole.schema.js";
import { workerAttendance } from "../modules/workers/workerAttendance.schema.js";
import { workerAreaOverride } from "../modules/workers/workerAreaOverride.schema.js";
import { workerAdvances } from "../modules/workers/advance.schema.js";

import { driverAreaAssignments } from "../modules/delivery/driverAreaAssignment.schema.js";

import { rawMaterials } from "../modules/inventory/rawMaterial.schema.js";
import { materialLots } from "../modules/inventory/materialLot.schema.js";
import { vendors } from "../modules/inventory/vendor.schema.js";
import { products } from "../modules/inventory/product.schema.js";
import { readyStockMovements } from "../modules/inventory/readyStockMovement.schema.js";
import { createBatchWithConsumption } from "../modules/inventory/batch.repository.js";

import { expenses } from "../modules/finance/expense.schema.js";
import { taxEntries } from "../modules/finance/taxEntry.schema.js";

// ------------------------------------------------------------- helpers
const isoDaysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[randomInt(0, arr.length - 1)];
const chance = (p) => Math.random() < p;

// Postgres has a ~65535 bound-parameter limit per statement - chunking
// keeps every bulk insert well under that regardless of column count.
const CHUNK_SIZE = 400;
const insertChunked = async (table, rows) => {
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    await db.insert(table).values(rows.slice(i, i + CHUNK_SIZE));
  }
};

const SAMPLE_RECEIPT_PDF = Buffer.from(
  `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 150]/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>endobj
4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
5 0 obj<</Length 96>>
stream
BT /F1 14 Tf 20 110 Td (BREAKTIME Bakery) Tj 0 -20 Td (Sample Purchase Receipt) Tj ET
endstream
endobj
xref
0 6
0000000000 65535 f
trailer<</Size 6/Root 1 0 R>>
startxref
0
%%EOF`,
  "utf-8",
);
const RECEIPT_KEY = "receipts/raw-materials/seed-sample-receipt.pdf";

const s3 = new S3Client({
  region: "auto",
  endpoint: env.R2_ENDPOINT,
  credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
});

const uploadSampleReceipt = async () => {
  await s3.send(new PutObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: RECEIPT_KEY, Body: SAMPLE_RECEIPT_PDF, ContentType: "application/pdf" }));
  console.log(`Uploaded sample receipt to ${RECEIPT_KEY}`);
};

// ---------------------------------------------------------------- areas
const AREA_DEFS = [
  { name: "Bandra", city: "Mumbai", pincode: "400050" },
  { name: "Andheri West", city: "Mumbai", pincode: "400058" },
  { name: "Andheri East", city: "Mumbai", pincode: "400069" },
  { name: "Powai", city: "Mumbai", pincode: "400076" },
  { name: "Juhu", city: "Mumbai", pincode: "400049" },
  { name: "Malad West", city: "Mumbai", pincode: "400064" },
  { name: "Goregaon East", city: "Mumbai", pincode: "400063" },
  { name: "Borivali West", city: "Mumbai", pincode: "400092" },
  { name: "Dadar West", city: "Mumbai", pincode: "400028" },
  { name: "Kurla West", city: "Mumbai", pincode: "400070" },
  { name: "Chembur", city: "Mumbai", pincode: "400071" },
  { name: "Thane West", city: "Thane", pincode: "400601" },
];

const seedAreas = async () => {
  const areaIds = {};
  for (const def of AREA_DEFS) {
    const existing = await db.select({ id: areas.id }).from(areas).where(eq(areas.name, def.name));
    if (existing[0]) {
      areaIds[def.name] = existing[0].id;
      continue;
    }
    const id = uuidv7();
    await db.insert(areas).values({ id, name: def.name, city: def.city, pincode: def.pincode });
    areaIds[def.name] = id;
  }
  console.log(`Areas ready: ${Object.keys(areaIds).length}`);
  return areaIds;
};

// --------------------------------------------------------------- stores
const STORES_PER_AREA_RANGE = [17, 22]; // -> ~230-240 stores total across 12 areas
const STORE_PREFIXES = [
  "Sunrise", "New", "Shree", "Royal", "City", "Metro", "Deluxe", "Ganesh", "Laxmi", "Sai",
  "Om", "Krishna", "Star", "Golden", "Silver", "National", "Modern", "Classic", "Prime", "Elite",
  "Amba", "Ashirwad", "Vijay", "Anand", "Shubh", "Blue Sky", "Green Leaf", "Sunshine", "Evergreen", "Highway",
];
const STORE_SUFFIXES = [
  "Bakery", "Store", "Sweets Mart", "Canteen", "Provisions", "Kirana", "General Store",
  "Corner Shop", "Food Corner", "Bakers", "Confectionery", "Cafe", "Snacks Center", "Super Store",
];
const STORE_TYPES = ["Shop", "Shop", "Shop", "Canteen", "Canteen", "Other"];

const seedStores = async (areaIds) => {
  const storesByArea = {}; // areaName -> [{id, dealerName}]
  let phoneCounter = 9800000000;

  for (const def of AREA_DEFS) {
    const areaId = areaIds[def.name];
    const existing = await db.select({ id: stores.id, dealerName: stores.dealerName }).from(stores).where(eq(stores.areaId, areaId));
    const target = randomInt(...STORES_PER_AREA_RANGE);
    storesByArea[def.name] = [...existing];

    if (existing.length >= target) continue;

    const usedNames = new Set(existing.map((s) => s.dealerName));
    const rows = [];
    while (storesByArea[def.name].length < target) {
      let name = `${pick(STORE_PREFIXES)} ${pick(STORE_SUFFIXES)}`;
      let suffix = 2;
      while (usedNames.has(name)) {
        name = `${pick(STORE_PREFIXES)} ${pick(STORE_SUFFIXES)} #${suffix++}`;
      }
      usedNames.add(name);

      const id = uuidv7();
      phoneCounter += randomInt(1, 37);
      rows.push({
        id,
        areaId,
        dealerName: name,
        storeType: pick(STORE_TYPES),
        dealerPhone: String(phoneCounter),
        address: `${randomInt(1, 200)}, ${pick(["Main Road", "Station Road", "Market Lane", "Cross Street", "Highway"])}, ${def.name}`,
      });
      storesByArea[def.name].push({ id, dealerName: name });
    }

    await insertChunked(stores, rows);
  }

  const total = Object.values(storesByArea).reduce((s, l) => s + l.length, 0);
  console.log(`Stores ready: ${total}`);
  return storesByArea;
};

// -------------------------------------------------------------- workers
const ATTENDANCE_DAYS = 30;
const SCHEDULE_DAYS = 30;
const DRIVER_ASSIGN_DAYS = 14;

const CHEF_NAMES = ["Ramesh Yadav", "Suresh Kadam", "Farhan Ali"];
const LABOUR_NAMES = ["Sunita Devi", "Meena Kumari", "Rekha Jadhav", "Geeta Pawar", "Kavita Shinde"];
const DELIVERY_NAMES = ["Anil Joseph", "Vikram Rane", "Salim Shaikh", "Deepak Chavan", "Manoj Gupta"];
const MARKETER_FIRST_NAMES = ["Imran", "Priya", "Dinesh", "Neha", "Arjun", "Pooja", "Rahul", "Kiran", "Sonal", "Rohit", "Asha", "Vivek"];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const createWorkerIfMissing = async (name, def) => {
  const existing = await db.select({ id: workers.id }).from(workers).where(eq(workers.name, name));
  if (existing[0]) return { id: existing[0].id, isNew: false };

  const id = uuidv7();
  await db.insert(workers).values({
    id,
    name,
    phone: String(9700000000 + randomInt(0, 99999999)),
    joiningDate: isoDaysAgo(randomInt(60, 400)),
    monthlySalary: def.monthlySalary,
    overtimeRate: def.overtimeRate,
    shiftStart: def.shiftStart,
    shiftEnd: def.shiftEnd,
    weekOffDay: pick(WEEKDAYS),
  });
  await db.insert(workerRoles).values(def.roles.map((role) => ({ id: uuidv7(), workerId: id, role })));
  return { id, isNew: true };
};

const seedAttendance = async (workerId) => {
  const rows = [];
  for (let i = 1; i <= ATTENDANCE_DAYS; i++) {
    const roll = Math.random();
    const status = roll < 0.8 ? "present" : roll < 0.9 ? "half_day" : "absent";
    rows.push({
      id: uuidv7(),
      workerId,
      date: isoDaysAgo(i),
      status,
      overtimeHours: status === "present" && chance(0.2) ? randomInt(1, 3) : 0,
    });
  }
  await insertChunked(workerAttendance, rows);
};

const seedWorkers = async (areaIds) => {
  const marketerIdByArea = {};
  const driverIds = [];
  const allNewWorkerIds = [];

  const areaNames = Object.keys(areaIds);
  for (let i = 0; i < areaNames.length; i++) {
    const areaName = areaNames[i];
    const surnames = ["Sharma", "Patel", "Sheikh", "Iyer", "Nair", "Reddy", "Kulkarni", "Joshi"];
    const name = `${MARKETER_FIRST_NAMES[i % MARKETER_FIRST_NAMES.length]} ${surnames[i % surnames.length]}`;
    const { id, isNew } = await createWorkerIfMissing(name, {
      roles: ["marketer"], monthlySalary: randomInt(11000, 14000), overtimeRate: randomInt(45, 60), shiftStart: "09:00", shiftEnd: "17:00",
    });
    marketerIdByArea[areaName] = id;
    if (isNew) {
      allNewWorkerIds.push(id);
      await seedAttendance(id);
      const overrideRows = [];
      for (let d = 1; d <= SCHEDULE_DAYS; d++) {
        overrideRows.push({ id: uuidv7(), workerId: id, date: isoDaysAgo(d), areaId: areaIds[areaName] });
      }
      await insertChunked(workerAreaOverride, overrideRows);
    }
  }

  for (const name of CHEF_NAMES) {
    const { id, isNew } = await createWorkerIfMissing(name, { roles: ["chef"], monthlySalary: randomInt(13000, 16000), overtimeRate: randomInt(55, 70), shiftStart: "06:00", shiftEnd: "14:00" });
    if (isNew) { allNewWorkerIds.push(id); await seedAttendance(id); }
  }
  for (const name of LABOUR_NAMES) {
    const { id, isNew } = await createWorkerIfMissing(name, { roles: ["labour"], monthlySalary: randomInt(9500, 11500), overtimeRate: randomInt(40, 50), shiftStart: "07:00", shiftEnd: "15:00" });
    if (isNew) { allNewWorkerIds.push(id); await seedAttendance(id); }
  }
  const newDriverIds = [];
  for (const name of DELIVERY_NAMES) {
    const { id, isNew } = await createWorkerIfMissing(name, { roles: ["delivery"], monthlySalary: randomInt(10500, 12500), overtimeRate: randomInt(45, 55), shiftStart: "08:00", shiftEnd: "16:00" });
    driverIds.push(id);
    if (isNew) { allNewWorkerIds.push(id); newDriverIds.push(id); await seedAttendance(id); }
  }

  if (newDriverIds.length) {
    const areaIdList = Object.values(areaIds);
    const assignRows = [];
    for (const driverId of newDriverIds) {
      for (let d = 1; d <= DRIVER_ASSIGN_DAYS; d++) {
        const date = isoDaysAgo(d);
        const areaCount = randomInt(1, 2);
        const chosen = new Set();
        while (chosen.size < areaCount) chosen.add(pick(areaIdList));
        for (const areaId of chosen) assignRows.push({ id: uuidv7(), driverId, date, areaId });
      }
    }
    await insertChunked(driverAreaAssignments, assignRows);
  }

  // A couple of advances per newly-created worker over the last 2 months.
  if (allNewWorkerIds.length) {
    const advanceRows = [];
    for (const workerId of allNewWorkerIds) {
      const count = randomInt(0, 2);
      for (let i = 0; i < count; i++) {
        advanceRows.push({ id: uuidv7(), workerId, date: isoDaysAgo(randomInt(1, 55)), amount: randomInt(500, 3000), note: pick(["Advance requested", "Emergency advance", "Festival advance", null]) });
      }
    }
    await insertChunked(workerAdvances, advanceRows);
  }

  console.log(`Workers ready: ${areaNames.length} marketers, ${CHEF_NAMES.length} chefs, ${LABOUR_NAMES.length} labour, ${DELIVERY_NAMES.length} delivery`);
  return { marketerIdByArea, driverIds };
};

// ------------------------------------------------------ raw materials
const VENDOR_NAMES = ["Sunrise Flour Mills", "Om Sweeteners", "Amul Distributors", "Baker's Supply Co", "Local Dairy Co-op", "Cocoa House", "Fresh Dairy Traders", "Spice & Bake Supplies"];

const RAW_MATERIAL_DEFS = [
  { name: "Maida (Refined Flour)", unit: "kg", lowStockAt: 40, lotQtyRange: [400, 600], rate: [40, 46] },
  { name: "Sugar", unit: "kg", lowStockAt: 30, lotQtyRange: [200, 320], rate: [44, 50] },
  { name: "Butter", unit: "kg", lowStockAt: 20, lotQtyRange: [150, 250], rate: [500, 560] },
  { name: "Yeast", unit: "kg", lowStockAt: 6, lotQtyRange: [25, 45], rate: [360, 400] },
  { name: "Milk", unit: "litre", lowStockAt: 50, lotQtyRange: [280, 420], rate: [56, 62] },
  { name: "Chocolate Chips", unit: "kg", lowStockAt: 15, lotQtyRange: [60, 100], rate: [620, 680] },
  { name: "Cheese", unit: "kg", lowStockAt: 10, lotQtyRange: [70, 110], rate: [380, 430] },
  { name: "Baking Powder", unit: "kg", lowStockAt: 3, lotQtyRange: [8, 14], rate: [180, 220] },
];
const LOTS_PER_MATERIAL = 6;

const upsertVendor = async (name, cache) => {
  if (cache[name]) return cache[name];
  const existing = await db.select({ id: vendors.id }).from(vendors).where(eq(vendors.name, name));
  if (existing[0]) return (cache[name] = existing[0].id);
  const id = uuidv7();
  await db.insert(vendors).values({ id, name, phone: String(9600000000 + randomInt(0, 99999999)) });
  return (cache[name] = id);
};

const seedRawMaterials = async () => {
  await uploadSampleReceipt();
  const vendorCache = {};

  for (const def of RAW_MATERIAL_DEFS) {
    const existing = await db.select({ id: rawMaterials.id }).from(rawMaterials).where(eq(rawMaterials.name, def.name));
    if (existing[0]) continue;

    const materialId = uuidv7();
    await db.insert(rawMaterials).values({ id: materialId, name: def.name, unit: def.unit, lowStockAt: def.lowStockAt });

    const lotRows = [];
    for (let i = 0; i < LOTS_PER_MATERIAL; i++) {
      const vendorId = await upsertVendor(pick(VENDOR_NAMES), vendorCache);
      const daysAgo = randomInt(3, 90);
      const qty = randomInt(...def.lotQtyRange);
      lotRows.push({
        id: uuidv7(),
        rawMaterialId: materialId,
        vendorId,
        originalQty: qty,
        remainingQty: qty,
        unitCost: randomInt(...def.rate),
        purchaseDate: isoDaysAgo(daysAgo),
        isPaid: daysAgo > 14,
        paidDate: daysAgo > 14 ? isoDaysAgo(daysAgo - randomInt(1, 5)) : null,
        receiptKey: chance(0.6) ? RECEIPT_KEY : null,
      });
    }
    await insertChunked(materialLots, lotRows);
  }

  console.log(`Raw materials ready: ${RAW_MATERIAL_DEFS.length} materials`);
};

// ------------------------------------------------ batches -> products
// perUnit ingredient rates (raw material qty needed per 1 unit produced),
// derived from realistic small-batch bakery recipes.
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
const BATCH_DAYS = 30;

const seedBatches = async () => {
  const existingProducts = await db.select({ id: products.id, name: products.name }).from(products);
  const productIds = Object.fromEntries(existingProducts.map((p) => [p.name, p.id]));

  const rawMaterialRows = await db.select({ id: rawMaterials.id, name: rawMaterials.name }).from(rawMaterials);
  const rawMaterialIdByName = Object.fromEntries(rawMaterialRows.map((r) => [r.name, r.id]));

  for (const def of PRODUCT_DEFS) {
    if (productIds[def.name]) continue; // already seeded once - see file header re: idempotency

    const ingredientNames = Object.keys(def.perUnit).filter((name) => rawMaterialIdByName[name]);
    if (ingredientNames.length === 0) {
      console.log(`Skipping ${def.name} - none of its raw materials exist`);
      continue;
    }

    let batchCount = 0;
    for (let d = BATCH_DAYS; d >= 1; d--) {
      if (!chance(0.85)) continue; // most days produce this product, not literally every day
      const quantityProduced = randomInt(60, 200);
      const ingredients = ingredientNames.map((name) => ({ rawMaterialId: rawMaterialIdByName[name], qty: Number((def.perUnit[name] * quantityProduced).toFixed(3)) }));
      const jitter = 1 + (Math.random() * 0.2 - 0.1);

      try {
        await createBatchWithConsumption({
          productName: def.name,
          quantityProduced,
          unit: def.unit,
          pricePerUnit: Math.round(def.basePrice * jitter),
          producedAt: isoDaysAgo(d),
          ingredients,
        });
        batchCount++;
      } catch (err) {
        console.log(`Stopped producing ${def.name} early (day -${d}) - ${err.message}`);
        break;
      }
    }
    console.log(`Created ${batchCount} batches for ${def.name}`);
  }

  const refreshed = await db.select({ id: products.id, name: products.name }).from(products);
  return Object.fromEntries(refreshed.map((p) => [p.name, p.id]));
};

// ---------------------------------------------------- ready-stock ledger
// Tracks what's actually available per product as orders/walk-in sales
// are generated in-memory below, so nothing ever "sells" more than was
// really produced - same invariant the real app enforces at request time.
const buildStockLedger = async (productIds) => {
  const ledger = {};
  for (const [name, id] of Object.entries(productIds)) {
    const [{ available }] = await db
      .select({ available: sql`COALESCE(SUM(${readyStockMovements.quantity}), 0)`.mapWith(Number) })
      .from(readyStockMovements)
      .where(eq(readyStockMovements.productId, id));
    ledger[id] = available;
  }
  return ledger;
};

// -------------------------------------------------------------- orders
const ORDER_DAYS = 21;
const ORDER_PROBABILITY_PER_STORE_PER_DAY = 0.4;

const seedOrders = async (storesByArea, marketerIdByArea, productIds) => {
  const existing = await db.select({ id: orders.id }).from(orders).limit(1);
  if (existing.length > 0) {
    console.log("Skipping orders - some already exist");
    return;
  }

  const productList = Object.entries(productIds); // [name, id][]
  if (productList.length === 0) {
    console.log("Skipping orders - no products to order");
    return;
  }

  const ledger = await buildStockLedger(productIds);
  const orderRows = [];
  const itemRows = [];
  const movementRows = [];
  let deliveredCount = 0;

  for (const [areaName, areaStores] of Object.entries(storesByArea)) {
    const orderTakerId = marketerIdByArea[areaName];
    if (!orderTakerId) continue;

    for (const store of areaStores) {
      for (let d = ORDER_DAYS; d >= 0; d--) {
        if (!chance(ORDER_PROBABILITY_PER_STORE_PER_DAY)) continue;

        const lineCount = randomInt(1, 3);
        const chosenProducts = new Set();
        while (chosenProducts.size < lineCount) chosenProducts.add(pick(productList));
        const lines = [...chosenProducts].map(([, productId]) => ({ productId, quantity: randomInt(5, 40) }));

        const orderDate = isoDaysAgo(d);
        const orderId = uuidv7();

        let status;
        let canDeliver = false;
        if (d === 0) {
          status = "in_transit";
        } else {
          const roll = Math.random();
          if (roll < 0.7) {
            canDeliver = lines.every((l) => ledger[l.productId] >= l.quantity);
            status = canDeliver ? "delivered" : pick(["shipped", "in_transit"]);
          } else {
            status = pick(["shipped", "in_transit"]);
          }
        }

        orderRows.push({
          id: orderId,
          storeId: store.id,
          orderTakerId,
          status,
          orderDate,
          fulfillmentDate: status === "delivered" ? orderDate : null,
          notes: status === "delivered" ? "Delivered fresh" : null,
        });

        for (const line of lines) {
          const fulfilledQty = canDeliver && status === "delivered" ? line.quantity : 0;
          const itemId = uuidv7();
          itemRows.push({ id: itemId, orderId, productId: line.productId, quantity: line.quantity, fulfilledQty });

          if (fulfilledQty > 0) {
            ledger[line.productId] -= fulfilledQty;
            movementRows.push({ id: uuidv7(), productId: line.productId, orderItemId: itemId, quantity: -fulfilledQty, reason: "sale", occurredAt: new Date(`${orderDate}T12:00:00.000Z`) });
          }
        }
        if (status === "delivered") deliveredCount++;
      }
    }
  }

  await insertChunked(orders, orderRows);
  await insertChunked(orderItems, itemRows);
  await insertChunked(readyStockMovements, movementRows);

  console.log(`Created ${orderRows.length} orders (${deliveredCount} delivered) with ${itemRows.length} line items`);
  return ledger;
};

// --------------------------------------------------------- walk-in sales
const WALK_IN_ATTEMPTS = 220;

const seedWalkInSales = async (productIds, ledger) => {
  const existing = await db.select({ id: walkInSales.id }).from(walkInSales).limit(1);
  if (existing.length > 0) {
    console.log("Skipping walk-in sales - some already exist");
    return;
  }
  if (!ledger) return;

  const productList = Object.entries(productIds);
  const priceByProductId = Object.fromEntries(PRODUCT_DEFS.map((p) => [p.name, p.basePrice]));
  const rows = [];
  const movementRows = [];

  for (let i = 0; i < WALK_IN_ATTEMPTS; i++) {
    const [name, productId] = pick(productList);
    const quantity = randomInt(1, 8);
    if ((ledger[productId] ?? 0) < quantity) continue;

    ledger[productId] -= quantity;
    const basePrice = priceByProductId[name] ?? 30;
    const amount = Math.round(quantity * basePrice * (1 + (Math.random() * 0.2 - 0.1)));
    const isPartial = chance(0.25);
    const amountPaid = isPartial ? Math.round(amount * (0.3 + Math.random() * 0.5)) : amount;
    const saleDate = isoDaysAgo(randomInt(0, ORDER_DAYS));

    rows.push({
      id: uuidv7(),
      productId,
      quantity,
      amount,
      paymentStatus: isPartial ? "partial" : "paid",
      amountPaid,
      saleDate,
    });
    movementRows.push({ id: uuidv7(), productId, quantity: -quantity, reason: "sale", occurredAt: new Date(`${saleDate}T15:00:00.000Z`) });
  }

  await insertChunked(walkInSales, rows);
  await insertChunked(readyStockMovements, movementRows);
  console.log(`Created ${rows.length} walk-in sales`);
};

// ------------------------------------------------------------ finance
const EXPENSE_MONTHS = 6;
const EXPENSE_TEMPLATES = [
  { category: "Electricity", amount: [3500, 5000], note: "Monthly electricity bill" },
  { category: "Water", amount: [600, 1000], note: "Water bill" },
  { category: "Gas / Fuel", amount: [3000, 4500], note: "Cooking gas refill" },
  { category: "Rent / Maintenance", amount: [16000, 20000], note: "Shop rent" },
  { category: "Packaging", amount: [1800, 3200], note: "Boxes and bags" },
  { category: "Staff Welfare", amount: [700, 1500], note: "Tea and snacks" },
  { category: "Transport / Fuel", amount: [1200, 2800], note: "Delivery fuel" },
  { category: "Repairs & Maintenance", amount: [500, 4000], note: "Equipment servicing" },
  { category: "Marketing", amount: [800, 2500], note: "Local promotion" },
  { category: "Banking Charges", amount: [150, 500], note: "Bank/POS charges" },
];

const seedExpenses = async () => {
  const existing = await db.select({ id: expenses.id }).from(expenses).limit(1);
  if (existing.length > 0) {
    console.log("Skipping expenses - some already exist");
    return;
  }

  const rows = [];
  for (let m = 0; m < EXPENSE_MONTHS; m++) {
    for (const t of EXPENSE_TEMPLATES) {
      if (!chance(0.85)) continue;
      rows.push({ id: uuidv7(), category: t.category, amount: randomInt(...t.amount), date: isoDaysAgo(m * 30 + randomInt(1, 28)), note: t.note });
    }
  }
  await insertChunked(expenses, rows);
  console.log(`Created ${rows.length} expenses across ${EXPENSE_MONTHS} months`);
};

const seedTaxEntries = async () => {
  const existing = await db.select({ id: taxEntries.id }).from(taxEntries).limit(1);
  if (existing.length > 0) {
    console.log("Skipping tax entries - some already exist");
    return;
  }

  const rows = [];
  for (let m = 0; m < EXPENSE_MONTHS; m++) {
    rows.push({ id: uuidv7(), amount: randomInt(6500, 9500), date: isoDaysAgo(m * 30 + 5), note: `GST payment for ${m === 0 ? "this" : m + " month(s) ago"}` });
  }
  await insertChunked(taxEntries, rows);
  console.log(`Created ${rows.length} tax entries`);
};

// ------------------------------------------------------------------ run
const run = async () => {
  const areaIds = await seedAreas();
  const storesByArea = await seedStores(areaIds);
  const { marketerIdByArea } = await seedWorkers(areaIds);
  await seedRawMaterials();
  const productIds = await seedBatches();
  const ledgerAfterOrders = await seedOrders(storesByArea, marketerIdByArea, productIds);
  await seedWalkInSales(productIds, ledgerAfterOrders);
  await seedExpenses();
  await seedTaxEntries();

  console.log("Done.");
  process.exit(0);
};

run().catch((err) => {
  console.error("Seeding failed", err);
  process.exit(1);
});

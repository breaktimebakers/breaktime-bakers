// Seeds sample data across every module wired to the real backend so
// far: sales (areas/stores/orders), workers (incl. roles, assigned
// areas, attendance), inventory (batches -> products/ready stock, via
// the real FIFO consumption path), and finance (expenses/tax entries).
//
// Additive and idempotent by name/count, same as seedRawMaterials.js -
// safe to re-run. Existing rows (e.g. from manual testing) are left
// untouched; this only adds what's missing.
import { eq, and } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import { db } from "../db/index.js";
import { areas } from "../modules/sales/area.schema.js";
import { stores } from "../modules/sales/store.schema.js";
import { orders } from "../modules/sales/order.schema.js";
import { orderItems } from "../modules/sales/orderItem.schema.js";
import { workers } from "../modules/workers/worker.schema.js";
import { workerRoles } from "../modules/workers/workerRole.schema.js";
import { workerAreas } from "../modules/workers/workerArea.schema.js";
import { workerAttendance } from "../modules/workers/workerAttendance.schema.js";
import { rawMaterials } from "../modules/inventory/rawMaterial.schema.js";
import { products } from "../modules/inventory/product.schema.js";
import { createBatchWithConsumption } from "../modules/inventory/batch.repository.js";
import { expenses } from "../modules/finance/expense.schema.js";
import { taxEntries } from "../modules/finance/taxEntry.schema.js";

const isoDaysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

// ---------------------------------------------------------------- areas
const areaDefs = [
  { name: "Bandra", city: "Mumbai", pincode: "400050" },
  { name: "Andheri West", city: "Mumbai", pincode: "400058" },
  { name: "Powai", city: "Mumbai", pincode: "400076" },
  { name: "Juhu", city: "Mumbai", pincode: "400049" },
];

const seedAreas = async () => {
  const areaIds = {};

  for (const def of areaDefs) {
    const existing = await db.select({ id: areas.id }).from(areas).where(eq(areas.name, def.name));

    if (existing[0]) {
      areaIds[def.name] = existing[0].id;
      continue;
    }

    const id = uuidv7();
    await db.insert(areas).values({ id, name: def.name, city: def.city, pincode: def.pincode });
    areaIds[def.name] = id;
    console.log(`Created area: ${def.name}`);
  }

  return areaIds;
};

// --------------------------------------------------------------- stores
const storeDefs = [
  { area: "Bandra", dealerName: "Sunrise Bakery Store", storeType: "Shop", phone: "9876543210", address: "Hill Road, Bandra West" },
  { area: "Bandra", dealerName: "Cafe Mocha", storeType: "Canteen", phone: "9820011223", address: "Carter Road, Bandra West" },
  { area: "Andheri West", dealerName: "Andheri Sweets Mart", storeType: "Shop", phone: "9934567890", address: "SV Road, Andheri West" },
  { area: "Andheri West", dealerName: "Lokhandwala Canteen", storeType: "Canteen", phone: "9812345678", address: "Lokhandwala Complex, Andheri West" },
  { area: "Powai", dealerName: "Powai Food Corner", storeType: "Shop", phone: "9001234567", address: "Hiranandani Gardens, Powai" },
  { area: "Powai", dealerName: "IIT Campus Store", storeType: "Canteen", phone: "9009876543", address: "IIT Bombay, Powai" },
  { area: "Juhu", dealerName: "Juhu Beach Bakery", storeType: "Shop", phone: "9870012345", address: "Juhu Tara Road, Juhu" },
];

const seedStores = async (areaIds) => {
  const storeIds = {};

  for (const def of storeDefs) {
    const areaId = areaIds[def.area];
    const existing = await db
      .select({ id: stores.id })
      .from(stores)
      .where(and(eq(stores.areaId, areaId), eq(stores.dealerName, def.dealerName)));

    if (existing[0]) {
      storeIds[def.dealerName] = existing[0].id;
      continue;
    }

    const id = uuidv7();
    await db.insert(stores).values({
      id,
      areaId,
      dealerName: def.dealerName,
      storeType: def.storeType,
      dealerPhone: def.phone,
      address: def.address,
    });
    storeIds[def.dealerName] = id;
    console.log(`Created store: ${def.dealerName} (${def.area})`);
  }

  return storeIds;
};

// -------------------------------------------------------------- workers
const workerDefs = [
  { name: "Ramesh Yadav", roles: ["chef"], phone: "9876543210", monthlySalary: 13500, overtimeRate: 60, shiftStart: "06:00", shiftEnd: "14:00", weekOffDay: "Sunday", assignedAreas: [] },
  { name: "Sunita Devi", roles: ["labour"], phone: "9820011223", monthlySalary: 10500, overtimeRate: 45, shiftStart: "07:00", shiftEnd: "15:00", weekOffDay: "Sunday", assignedAreas: [] },
  { name: "Imran Sheikh", roles: ["marketer"], phone: "9934567890", monthlySalary: 12000, overtimeRate: 55, shiftStart: "09:00", shiftEnd: "17:00", weekOffDay: "Sunday", assignedAreas: ["Bandra", "Juhu"] },
  { name: "Priya Sharma", roles: ["marketer"], phone: "9001234567", monthlySalary: 12000, overtimeRate: 55, shiftStart: "09:00", shiftEnd: "17:00", weekOffDay: "Monday", assignedAreas: ["Andheri West"] },
  { name: "Dinesh Patel", roles: ["marketer"], phone: "9009876543", monthlySalary: 12500, overtimeRate: 55, shiftStart: "09:00", shiftEnd: "17:00", weekOffDay: "Sunday", assignedAreas: ["Powai"] },
  { name: "Anil Joseph", roles: ["delivery"], phone: "9812345678", monthlySalary: 11000, overtimeRate: 50, shiftStart: "08:00", shiftEnd: "16:00", weekOffDay: "Sunday", assignedAreas: [] },
];

const seedWorkers = async (areaIds) => {
  const workerIds = {};

  for (const def of workerDefs) {
    const existing = await db.select({ id: workers.id }).from(workers).where(eq(workers.name, def.name));

    let workerId;
    if (existing[0]) {
      workerId = existing[0].id;
    } else {
      workerId = uuidv7();
      await db.insert(workers).values({
        id: workerId,
        name: def.name,
        phone: def.phone,
        joiningDate: isoDaysAgo(90),
        monthlySalary: def.monthlySalary,
        overtimeRate: def.overtimeRate,
        shiftStart: def.shiftStart,
        shiftEnd: def.shiftEnd,
        weekOffDay: def.weekOffDay,
      });

      await db.insert(workerRoles).values(def.roles.map((role) => ({ id: uuidv7(), workerId, role })));

      if (def.assignedAreas.length) {
        await db.insert(workerAreas).values(
          def.assignedAreas.map((areaName) => ({ id: uuidv7(), workerId, areaId: areaIds[areaName] })),
        );
      }

      // Last 6 days of attendance - mostly present, one absent, one half-day.
      const statuses = ["present", "present", "present", "absent", "present", "half_day"];
      for (let i = 1; i <= 6; i++) {
        await db.insert(workerAttendance).values({
          id: uuidv7(),
          workerId,
          date: isoDaysAgo(i),
          status: statuses[i - 1],
          overtimeHours: statuses[i - 1] === "present" && i === 1 ? 2 : 0,
        });
      }

      console.log(`Created worker: ${def.name} (${def.roles.join(", ")})`);
    }

    workerIds[def.name] = workerId;
  }

  return workerIds;
};

// ------------------------------------------------ batches -> products
// Reuses the real FIFO-consumption path (same one the app uses) so this
// draws down actual raw material lot stock rather than inserting
// products directly - keeps the demo data internally consistent.
const batchDefs = [
  { productName: "Butter Croissants", quantityProduced: 40, unit: "pcs", pricePerUnit: 35, ingredients: { "Maida (Refined Flour)": 3, "Butter": 2, "Milk": 2, "Yeast": 0.3 } },
  { productName: "Milk Bread", quantityProduced: 30, unit: "loaves", pricePerUnit: 45, ingredients: { "Maida (Refined Flour)": 4, "Milk": 3, "Sugar": 1, "Yeast": 0.3 } },
  { productName: "Cocoa Cookies", quantityProduced: 60, unit: "pcs", pricePerUnit: 20, ingredients: { "Maida (Refined Flour)": 3, "Sugar": 2, "Butter": 1.5, "Chocolate Chips": 1 } },
  { productName: "Dinner Buns", quantityProduced: 50, unit: "pcs", pricePerUnit: 15, ingredients: { "Maida (Refined Flour)": 3, "Milk": 2, "Sugar": 0.5, "Yeast": 0.3 } },
  { productName: "Tea Cakes", quantityProduced: 25, unit: "pcs", pricePerUnit: 60, ingredients: { "Maida (Refined Flour)": 2, "Sugar": 1.5, "Butter": 1, "Milk": 1 } },
];

const seedBatches = async () => {
  const productIds = {};

  const existingProducts = await db.select({ id: products.id, name: products.name }).from(products);
  for (const p of existingProducts) productIds[p.name] = p.id;

  const rawMaterialRows = await db.select({ id: rawMaterials.id, name: rawMaterials.name }).from(rawMaterials);
  const rawMaterialIdByName = Object.fromEntries(rawMaterialRows.map((r) => [r.name, r.id]));

  for (const def of batchDefs) {
    if (productIds[def.productName]) {
      continue;
    }

    const ingredientLines = Object.entries(def.ingredients)
      .filter(([name]) => rawMaterialIdByName[name])
      .map(([name, qty]) => ({ rawMaterialId: rawMaterialIdByName[name], qty }));

    if (ingredientLines.length === 0) {
      console.log(`Skipping batch ${def.productName} - none of its raw materials exist yet`);
      continue;
    }

    try {
      await createBatchWithConsumption({
        productName: def.productName,
        quantityProduced: def.quantityProduced,
        unit: def.unit,
        pricePerUnit: def.pricePerUnit,
        producedAt: isoDaysAgo(2),
        ingredients: ingredientLines,
      });
      console.log(`Created batch: ${def.productName} (${def.quantityProduced} ${def.unit})`);
    } catch (err) {
      console.log(`Skipping batch ${def.productName} - ${err.message}`);
    }
  }

  const refreshedProducts = await db.select({ id: products.id, name: products.name }).from(products);
  return Object.fromEntries(refreshedProducts.map((p) => [p.name, p.id]));
};

// -------------------------------------------------------------- orders
const seedOrders = async (storeIds, workerIds, productIds) => {
  const existing = await db.select({ id: orders.id }).from(orders);
  if (existing.length > 0) {
    console.log("Skipping orders - some already exist");
    return;
  }

  const productList = Object.entries(productIds);
  if (productList.length === 0) {
    console.log("Skipping orders - no products to order");
    return;
  }

  const marketers = ["Imran Sheikh", "Priya Sharma", "Dinesh Patel"].filter((n) => workerIds[n]);
  const storeList = Object.entries(storeIds);

  const orderDefs = [
    { store: "Sunrise Bakery Store", taker: "Imran Sheikh", daysAgo: 10, status: "delivered", lines: [["Butter Croissants", 24, 24]] },
    { store: "Cafe Mocha", taker: "Imran Sheikh", daysAgo: 8, status: "delivered", lines: [["Tea Cakes", 12, 12]] },
    { store: "Andheri Sweets Mart", taker: "Priya Sharma", daysAgo: 7, status: "delivered", lines: [["Milk Bread", 20, 20]] },
    { store: "Lokhandwala Canteen", taker: "Priya Sharma", daysAgo: 5, status: "shipped", lines: [["Cocoa Cookies", 50, 0]] },
    { store: "Powai Food Corner", taker: "Dinesh Patel", daysAgo: 4, status: "in_transit", lines: [["Dinner Buns", 30, 0]] },
    { store: "Sunrise Bakery Store", taker: "Imran Sheikh", daysAgo: 3, status: "delivered", lines: [["Cocoa Cookies", 40, 40], ["Tea Cakes", 10, 10]] },
    { store: "Juhu Beach Bakery", taker: "Imran Sheikh", daysAgo: 3, status: "shipped", lines: [["Butter Croissants", 18, 0]] },
    { store: "Andheri Sweets Mart", taker: "Priya Sharma", daysAgo: 2, status: "delivered", lines: [["Tea Cakes", 8, 8]] },
    { store: "Cafe Mocha", taker: "Imran Sheikh", daysAgo: 1, status: "in_transit", lines: [["Milk Bread", 15, 0]] },
    { store: "Powai Food Corner", taker: "Dinesh Patel", daysAgo: 1, status: "delivered", lines: [["Butter Croissants", 30, 30]] },
    { store: "IIT Campus Store", taker: "Dinesh Patel", daysAgo: 0, status: "in_transit", lines: [["Dinner Buns", 25, 0]] },
    { store: "Lokhandwala Canteen", taker: "Priya Sharma", daysAgo: 0, status: "in_transit", lines: [["Butter Croissants", 20, 0], ["Cocoa Cookies", 15, 0]] },
  ];

  let created = 0;
  for (const def of orderDefs) {
    const storeId = storeIds[def.store];
    const orderTakerId = workerIds[def.taker];
    if (!storeId || !orderTakerId) continue;

    const lines = def.lines.filter(([name]) => productIds[name]);
    if (lines.length === 0) continue;

    const orderId = uuidv7();
    const orderDate = isoDaysAgo(def.daysAgo);
    const fulfilled = def.status === "delivered";

    await db.insert(orders).values({
      id: orderId,
      storeId,
      orderTakerId,
      status: def.status,
      orderDate,
      fulfillmentDate: fulfilled ? orderDate : null,
      notes: fulfilled ? "Delivered fresh" : null,
    });

    await db.insert(orderItems).values(
      lines.map(([name, qty, fulfilledQty]) => ({
        id: uuidv7(),
        orderId,
        productId: productIds[name],
        quantity: qty,
        fulfilledQty,
      })),
    );

    created++;
  }

  console.log(`Created ${created} orders${marketers.length && storeList.length ? "" : ""}`);
};

// ------------------------------------------------------------ finance
const expenseDefs = [
  { category: "Electricity", amount: 4200, daysAgo: 5, note: "Monthly electricity bill" },
  { category: "Water", amount: 800, daysAgo: 5, note: "Water bill" },
  { category: "Gas / Fuel", amount: 3500, daysAgo: 12, note: "Cooking gas refill" },
  { category: "Rent / Maintenance", amount: 18000, daysAgo: 1, note: "Shop rent" },
  { category: "Packaging", amount: 2400, daysAgo: 9, note: "Boxes and bags" },
  { category: "Staff Welfare", amount: 1000, daysAgo: 15, note: "Tea and snacks" },
];

const seedExpenses = async () => {
  const existing = await db.select({ id: expenses.id }).from(expenses);
  if (existing.length > 0) {
    console.log("Skipping expenses - some already exist");
    return;
  }

  await db.insert(expenses).values(
    expenseDefs.map((e) => ({
      id: uuidv7(),
      category: e.category,
      amount: e.amount,
      date: isoDaysAgo(e.daysAgo),
      note: e.note,
    })),
  );
  console.log(`Created ${expenseDefs.length} expenses`);
};

const taxEntryDefs = [
  { amount: 8500, daysAgo: 5, note: "GST payment for this month" },
  { amount: 7800, daysAgo: 35, note: "GST payment for last month" },
];

const seedTaxEntries = async () => {
  const existing = await db.select({ id: taxEntries.id }).from(taxEntries);
  if (existing.length > 0) {
    console.log("Skipping tax entries - some already exist");
    return;
  }

  await db.insert(taxEntries).values(
    taxEntryDefs.map((t) => ({ id: uuidv7(), amount: t.amount, date: isoDaysAgo(t.daysAgo), note: t.note })),
  );
  console.log(`Created ${taxEntryDefs.length} tax entries`);
};

const run = async () => {
  const areaIds = await seedAreas();
  const storeIds = await seedStores(areaIds);
  const workerIds = await seedWorkers(areaIds);
  const productIds = await seedBatches();
  await seedOrders(storeIds, workerIds, productIds);
  await seedExpenses();
  await seedTaxEntries();

  console.log("Done.");
  process.exit(0);
};

run().catch((err) => {
  console.error("Seeding failed", err);
  process.exit(1);
});

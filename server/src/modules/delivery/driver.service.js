import { httpError } from "../../utils/httpError.js";
import { todayIso, daysAgoIso } from "../../utils/dateRange.js";
import * as driverRepo from "./driver.repository.js";
import * as workerRepo from "../workers/worker.repository.js";

const requireDriver = async (driverId) => {
  const worker = await workerRepo.findWorkerById(driverId);
  if (!worker) throw httpError(404, "Driver not found");
  return worker;
};

// "No orders" is its own state, distinct from "pending" - an assigned
// store with nothing placed against it today isn't a delivery waiting to
// happen.
const storeStatus = (storeOrders) => {
  if (!storeOrders.length) return "no_orders";
  if (storeOrders.every((order) => order.status === "delivered")) return "delivered";
  if (storeOrders.some((order) => order.status === "delivered")) return "partial";
  return "pending";
};

export const getDriverDay = async (driverId, requestedDate) => {
  await requireDriver(driverId);
  const date = requestedDate || todayIso();
  const rows = await driverRepo.getDriverDay(driverId, date);

  const areasById = new Map();
  for (const row of rows) {
    if (!areasById.has(row.areaId)) {
      areasById.set(row.areaId, { areaId: row.areaId, areaName: row.areaName, stores: [] });
    }
    areasById.get(row.areaId).stores.push({
      storeId: row.storeId,
      storeName: row.storeName,
      shopName: row.shopName,
      phone: row.storePhone,
      address: row.storeAddress,
      orders: row.orders,
      status: storeStatus(row.orders),
    });
  }

  return { driverId, date, areas: [...areasById.values()] };
};

export const getDriverStats = async (driverId, rangeDays) => {
  await requireDriver(driverId);
  const from = daysAgoIso(rangeDays - 1);
  const to = todayIso();
  const rows = await driverRepo.getDriverDailyCounts(driverId, from, to);
  const byDate = new Map(rows.map((row) => [row.date, row]));

  const daily = [];
  for (let i = rangeDays - 1; i >= 0; i--) {
    const date = daysAgoIso(i);
    const row = byDate.get(date);
    daily.push({ date, total: row?.total || 0, delivered: row?.delivered || 0 });
  }

  return {
    daily,
    totalDelivered: daily.reduce((sum, day) => sum + day.delivered, 0),
    totalPending: daily.reduce((sum, day) => sum + (day.total - day.delivered), 0),
  };
};

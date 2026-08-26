import { httpError } from "../../utils/httpError.js";
import { resolveDateRange } from "../../utils/dateRange.js";
import * as orderRepo from "./order.repository.js";
import * as areaRepo from "./area.repository.js";
import * as workerRepo from "../workers/worker.repository.js";

const requireOrder = async (id) => {
  const order = await orderRepo.findOrderById(id);

  if (!order) {
    throw httpError(404, "Order not found");
  }

  return order;
};

const requireStore = async (storeId) => {
  const store = await areaRepo.findStoreById(storeId);

  if (!store) {
    throw httpError(404, "Store not found");
  }

  return store;
};

// Any worker can be referenced by id at the DB level (orderTakerId is
// just a FK to workers), but an order taker specifically must hold the
// "marketer" role - roles live in a separate join table (worker_roles),
// so this is a business rule checked here, not something the FK itself
// can express.
const requireMarketerWorker = async (workerId) => {
  const worker = await workerRepo.findWorkerById(workerId);

  if (!worker) {
    throw httpError(404, "Order taker not found");
  }

  if (!worker.roles.includes("marketer")) {
    throw httpError(400, "Selected worker is not a marketer", "NOT_A_MARKETER");
  }

  return worker;
};

export const listOrders = (query) => {
  const { filter, from: rawFrom, to: rawTo, ...rest } = query;
  const { from, to } = resolveDateRange({ filter, from: rawFrom, to: rawTo });

  return orderRepo.listOrders({ ...rest, from, to });
};

export const createOrder = async (body) => {
  await requireStore(body.storeId);
  await requireMarketerWorker(body.orderTakerId);

  return orderRepo.createOrderWithItems(body);
};

export const updateOrderStatus = async (id, status) => {
  await requireOrder(id);

  return orderRepo.updateOrderStatus(id, status);
};

export const fulfillOrder = async (id, body) => {
  await requireOrder(id);

  return orderRepo.fulfillOrder(id, body);
};

import { httpError } from "../../utils/httpError.js";
import { resolveDateRange, todayIso } from "../../utils/dateRange.js";
import { resolvePagination } from "../../utils/pagination.js";
import * as orderRepo from "./order.repository.js";
import * as areaRepo from "./area.repository.js";
import * as workerRepo from "../workers/worker.repository.js";
import * as scheduleService from "../workers/schedule.service.js";

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

export const listOrders = async (query) => {
  const { filter, from: rawFrom, to: rawTo, page, pageSize, ...rest } = query;
  const { from, to } = resolveDateRange({ filter, from: rawFrom, to: rawTo });
  const filters = { ...rest, from, to };

  if (page === undefined) {
    return { orders: await orderRepo.listOrders(filters) };
  }

  const [totalItems, orderTakerCounts] = await Promise.all([
    orderRepo.countOrders(filters),
    orderRepo.countOrdersByOrderTaker(),
  ]);
  const pagination = resolvePagination(totalItems, { page, pageSize });
  const orders = await orderRepo.listOrders({ ...filters, ...pagination });

  return { orders, pagination, orderTakerCounts };
};

// An order taker can only take orders for the area they're actually
// scheduled to today (server's today, matching the orderDate the order
// itself gets stamped with) - see schedule.service.js for how "today's
// area" is resolved (an override for the date if one exists, else the
// worker's recurring weekly route).
const requireScheduledForStoreToday = async (workerId, store) => {
  if (!store.areaId) {
    throw httpError(400, "This store has no area assigned yet", "STORE_UNASSIGNED");
  }

  const effectiveAreaId = await scheduleService.getEffectiveAreaForWorker(workerId, todayIso());

  if (!effectiveAreaId) {
    throw httpError(400, "This order taker isn't scheduled to any area today", "NOT_SCHEDULED_TODAY");
  }

  if (effectiveAreaId !== store.areaId) {
    throw httpError(
      400,
      "This order taker isn't assigned to this store's area today",
      "AREA_MISMATCH_TODAY",
    );
  }
};

export const createOrder = async (body) => {
  const store = await requireStore(body.storeId);
  await requireMarketerWorker(body.orderTakerId);
  await requireScheduledForStoreToday(body.orderTakerId, store);

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

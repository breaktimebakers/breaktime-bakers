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
// area" is resolved from the assignment for this exact date.
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

  // Defense in depth - the route's Zod schema already excludes "delivered"
  // from this endpoint, but this keeps the rule true even if this service
  // fn is ever called from somewhere else.
  if (status === "delivered") {
    throw httpError(400, "Mark an order delivered via order fulfillment, not this endpoint", "USE_FULFILL_ENDPOINT");
  }

  return orderRepo.updateOrderStatus(id, status);
};

export const fulfillOrder = async (id, body) => {
  const order = await requireOrder(id);
  const { status, fulfillmentDate, items } = body;

  const orderItemsById = new Map(order.items.map((item) => [item.id, item]));

  // A fulfillment request is a full snapshot: every line on the order must
  // be present exactly once (dedup already enforced by the schema), no
  // more, no less - this is what rules out a request whose items belong to
  // a different order silently updating zero rows while the parent order's
  // status/date still move.
  if (items.length !== order.items.length) {
    throw httpError(400, "Fulfillment must include every item on the order, exactly once", "ITEM_SET_MISMATCH");
  }

  // Fulfilled quantity is allowed to exceed what was ordered (e.g. rounding
  // up to a packable unit, or genuinely sending extra) - only that each
  // submitted item actually belongs to this order is enforced here.
  for (const line of items) {
    if (!orderItemsById.has(line.itemId)) {
      throw httpError(400, `Item ${line.itemId} does not belong to this order`, "UNKNOWN_ORDER_ITEM");
    }
  }

  if (fulfillmentDate) {
    if (fulfillmentDate < order.orderDate) {
      throw httpError(400, "Fulfillment date cannot be before the order date", "FULFILLMENT_BEFORE_ORDER_DATE");
    }

    if (fulfillmentDate > todayIso()) {
      throw httpError(400, "Fulfillment date cannot be in the future", "FULFILLMENT_IN_FUTURE");
    }
  }

  // Partial fulfillment is allowed to be closed out as delivered (e.g.
  // stock ran short) - fulfilledQty is stored exactly as submitted, never
  // auto-topped-up to the ordered quantity, so "delivered" never silently
  // implies "fully fulfilled". It does require that *something* was
  // actually fulfilled, and (enforced at the schema level) a fulfillment
  // date.
  if (status === "delivered" && items.every((line) => line.fulfilledQty === 0)) {
    throw httpError(400, "Cannot mark an order delivered with no fulfilled quantity", "ZERO_FULFILLMENT");
  }

  return orderRepo.fulfillOrder(id, body);
};

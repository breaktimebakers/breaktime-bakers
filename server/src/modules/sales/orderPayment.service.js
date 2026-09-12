import { httpError } from "../../utils/httpError.js";
import { resolveDateRange, todayIso } from "../../utils/dateRange.js";
import * as orderPaymentRepo from "./orderPayment.repository.js";
import * as orderRepo from "./order.repository.js";
import { requireDeliveryWorker } from "./order.service.js";

const requireOrder = async (id) => {
  const order = await orderRepo.findOrderById(id);

  if (!order) {
    throw httpError(404, "Order not found");
  }

  return order;
};

export const recordPayment = async (body) => {
  await requireOrder(body.orderId);

  if (body.collectedBy) {
    await requireDeliveryWorker(body.collectedBy);
  }

  return orderPaymentRepo.recordPayment({
    orderId: body.orderId,
    amount: body.amount,
    collectedBy: body.collectedBy || null,
    paymentDate: body.paymentDate || todayIso(),
    notes: body.notes,
  });
};

export const listPaymentsForOrder = async (orderId) => {
  await requireOrder(orderId);

  return orderPaymentRepo.listPaymentsForOrder(orderId);
};

// Attaches balance + a paid/partial/unpaid status to each ledger row -
// derived here rather than stored, same computed-at-read-time philosophy
// as the repository's billed/paid sums.
export const getStoreLedger = async (storeId) => {
  const [summary, orderRows] = await Promise.all([
    orderPaymentRepo.getStorePaymentSummary(storeId),
    orderPaymentRepo.listStoreOrderLedger(storeId),
  ]);

  return {
    ...summary,
    orders: orderRows.map((row) => ({
      ...row,
      balance: row.billed - row.paid,
      paymentStatus: row.paid <= 0 ? "unpaid" : row.paid >= row.billed ? "paid" : "partial",
    })),
  };
};

export const getAreaSummaries = () => orderPaymentRepo.getAreaPaymentSummaries();

export const getAreaStoreSummaries = async (areaId, rangeQuery = {}) => {
  const rows = await orderPaymentRepo.listStoreSummariesForArea(areaId, resolveDateRange(rangeQuery));

  return rows.map((row) => ({ ...row, outstanding: row.totalBilled - row.paid }));
};

export const getOverview = () => orderPaymentRepo.getOverviewTotals();

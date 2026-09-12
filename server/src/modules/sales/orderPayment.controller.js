import { sendResponse } from "../../utils/apiResponse.js";
import * as orderPaymentService from "./orderPayment.service.js";

export const record = async (req, res) => {
  const payment = await orderPaymentService.recordPayment(req.body);

  sendResponse(res, 201, "Payment recorded", { payment });
};

export const listForOrder = async (req, res) => {
  const payments = await orderPaymentService.listPaymentsForOrder(req.validatedQuery.orderId);

  sendResponse(res, 200, "Order payments fetched", { payments });
};

export const overview = async (req, res) => {
  sendResponse(res, 200, "Customer payments overview fetched", await orderPaymentService.getOverview());
};

export const areas = async (req, res) => {
  const areas = await orderPaymentService.getAreaSummaries();

  sendResponse(res, 200, "Area payment summaries fetched", { areas });
};

export const areaStores = async (req, res) => {
  const stores = await orderPaymentService.getAreaStoreSummaries(req.params.areaId, req.validatedQuery);

  sendResponse(res, 200, "Area store summaries fetched", { stores });
};

export const storeDetail = async (req, res) => {
  const ledger = await orderPaymentService.getStoreLedger(req.params.storeId);

  sendResponse(res, 200, "Store payment ledger fetched", ledger);
};

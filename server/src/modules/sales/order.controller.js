import { sendResponse } from "../../utils/apiResponse.js";
import * as orderService from "./order.service.js";

export const list = async (req, res) => {
  const result = await orderService.listOrders(req.validatedQuery);

  sendResponse(res, 200, "Orders fetched", result);
};

export const create = async (req, res) => {
  const order = await orderService.createOrder(req.body);

  sendResponse(res, 201, "Order created", { order });
};

export const updateStatus = async (req, res) => {
  const order = await orderService.updateOrderStatus(req.params.id, req.body.status);

  sendResponse(res, 200, "Order status updated", { order });
};

export const fulfill = async (req, res) => {
  const order = await orderService.fulfillOrder(req.params.id, req.body);

  sendResponse(res, 200, "Order fulfilled", { order });
};

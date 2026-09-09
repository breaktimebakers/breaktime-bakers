import { sendResponse } from "../../utils/apiResponse.js";
import * as walkInSaleService from "./walkInSale.service.js";

export const list = async (req, res) => {
  const walkInSales = await walkInSaleService.listWalkInSales();

  sendResponse(res, 200, "Walk-in sales fetched", { walkInSales });
};

export const create = async (req, res) => {
  const walkInSale = await walkInSaleService.createWalkInSale(req.body);

  sendResponse(res, 201, "Walk-in sale recorded", { walkInSale });
};

export const settle = async (req, res) => {
  const walkInSale = await walkInSaleService.settleWalkInSale(req.params.id);

  sendResponse(res, 200, "Walk-in sale marked paid", { walkInSale });
};

export const addPayment = async (req, res) => {
  const walkInSale = await walkInSaleService.addWalkInSalePayment(req.params.id, req.body.amount);

  sendResponse(res, 200, "Payment recorded", { walkInSale });
};

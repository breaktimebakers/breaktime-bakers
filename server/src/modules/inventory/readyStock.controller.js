import { sendResponse } from "../../utils/apiResponse.js";
import * as readyStockService from "./readyStock.service.js";

export const list = async (req, res) => {
  const readyStock = await readyStockService.listReadyStock(req.validatedQuery);

  sendResponse(res, 200, "Ready stock fetched", { readyStock });
};

export const history = async (req, res) => {
  const history = await readyStockService.getStockHistory(req.params.id, req.validatedQuery);

  sendResponse(res, 200, "Stock history fetched", { history });
};

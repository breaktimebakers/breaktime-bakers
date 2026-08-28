import { resolveDateRange, resolveMonthRange } from "../../utils/dateRange.js";
import { httpError } from "../../utils/httpError.js";
import { findProductById } from "./product.repository.js";
import * as readyStockRepo from "./readyStock.repository.js";

export const listReadyStock = (query) => readyStockRepo.listReadyStock(resolveDateRange(query));

export const getStockHistory = async (productId, query) => {
  const product = await findProductById(productId);

  if (!product) {
    throw httpError(404, "Product not found");
  }

  return readyStockRepo.listStockHistoryForProduct(productId, resolveMonthRange(query));
};

import { resolveDateRange } from "../../utils/dateRange.js";
import * as readyStockRepo from "./readyStock.repository.js";

export const listReadyStock = (query) => readyStockRepo.listReadyStock(resolveDateRange(query));

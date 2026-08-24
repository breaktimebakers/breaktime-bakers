import { resolveDateRange } from "../../utils/dateRange.js";
import * as batchRepo from "./batch.repository.js";

export const listBatches = (query) => batchRepo.listBatches(resolveDateRange(query));

export const createBatch = (body) => batchRepo.createBatchWithConsumption(body);

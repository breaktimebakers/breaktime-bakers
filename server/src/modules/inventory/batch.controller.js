import { sendResponse } from "../../utils/apiResponse.js";
import * as batchService from "./batch.service.js";

export const list = async (req, res) => {
  const batches = await batchService.listBatches(req.validatedQuery);

  sendResponse(res, 200, "Batches fetched", { batches });
};

export const create = async (req, res) => {
  const batch = await batchService.createBatch(req.body);

  sendResponse(res, 201, "Batch created", { batch });
};

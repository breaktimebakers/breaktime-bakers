import { sendResponse } from "../../utils/apiResponse.js";
import * as advanceService from "./advance.service.js";

export const list = async (req, res) => {
  const advances = await advanceService.listAdvances(req.validatedQuery);

  sendResponse(res, 200, "Advances fetched", { advances });
};

export const create = async (req, res) => {
  const advance = await advanceService.createAdvance(req.body);

  sendResponse(res, 201, "Advance recorded", { advance });
};

export const remove = async (req, res) => {
  await advanceService.deleteAdvance(req.params.id);

  sendResponse(res, 200, "Advance deleted", null);
};

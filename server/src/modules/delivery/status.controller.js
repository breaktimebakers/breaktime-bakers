import { sendResponse } from "../../utils/apiResponse.js";
import * as statusService from "./status.service.js";

export const list = async (req, res) => {
  sendResponse(res, 200, "Delivery status fetched", await statusService.listDeliveryStatus(req.validatedQuery));
};

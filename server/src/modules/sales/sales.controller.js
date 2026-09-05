import { sendResponse } from "../../utils/apiResponse.js";
import * as salesService from "./sales.service.js";

export const overview = async (req, res) => {
  const overview = await salesService.getOverview();

  sendResponse(res, 200, "Sales overview fetched", { overview });
};

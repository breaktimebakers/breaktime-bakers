import { sendResponse } from "../../utils/apiResponse.js";
import * as driverService from "./driver.service.js";

export const getDay = async (req, res) => {
  sendResponse(res, 200, "Driver's day fetched", await driverService.getDriverDay(req.params.id, req.validatedQuery.date));
};

export const getStats = async (req, res) => {
  sendResponse(res, 200, "Driver stats fetched", await driverService.getDriverStats(req.params.id, req.validatedQuery.range));
};

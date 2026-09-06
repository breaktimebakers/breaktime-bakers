import { sendResponse } from "../../utils/apiResponse.js";
import * as scheduleService from "./schedule.service.js";

export const getDay = async (req, res) => {
  sendResponse(res, 200, "Daily driver assignments fetched", await scheduleService.getDaySchedule(req.validatedQuery.date));
};

export const getToday = async (_req, res) => {
  sendResponse(res, 200, "Today's driver assignments fetched", await scheduleService.getTodaySchedule());
};

export const setAreas = async (req, res) => {
  const result = await scheduleService.setDriverDayAreas(req.params.driverId, req.body.date, req.body.areaIds);
  sendResponse(res, 200, "Driver's areas saved", result);
};

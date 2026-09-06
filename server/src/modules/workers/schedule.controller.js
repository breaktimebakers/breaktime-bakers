import { sendResponse } from "../../utils/apiResponse.js";
import * as scheduleService from "./schedule.service.js";

export const getDay = async (req, res) => {
  sendResponse(res, 200, "Daily assignments fetched", await scheduleService.getDaySchedule(req.validatedQuery.date));
};
export const getToday = async (_req, res) => {
  sendResponse(res, 200, "Today's assignments fetched", await scheduleService.getTodayAssignments());
};
export const setAssignment = async (req, res) => {
  const result = await scheduleService.setDailyAssignment(req.params.workerId, req.body.date, req.body.areaId);
  sendResponse(res, 200, "Daily assignment saved", result);
};

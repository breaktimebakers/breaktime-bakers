import { sendResponse } from "../../utils/apiResponse.js";
import * as scheduleService from "./schedule.service.js";

export const getWeek = async (req, res) => {
  const schedule = await scheduleService.getWeekSchedule(req.validatedQuery.weekStart);

  sendResponse(res, 200, "Schedule fetched", schedule);
};

export const getToday = async (req, res) => {
  const today = await scheduleService.getTodayAssignments();

  sendResponse(res, 200, "Today's schedule fetched", today);
};

export const saveTemplate = async (req, res) => {
  const result = await scheduleService.saveWeeklyTemplate(req.params.workerId, req.body.days);

  sendResponse(res, 200, "Weekly schedule saved", result);
};

export const setOverride = async (req, res) => {
  const result = await scheduleService.setOverride(req.params.workerId, req.body.date, req.body.areaId);

  sendResponse(res, 200, "Schedule override saved", result);
};

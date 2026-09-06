import { sendResponse } from "../../utils/apiResponse.js";
import * as attendanceService from "./attendance.service.js";

export const list = async (req, res) => {
  const result = await attendanceService.listAttendance(req.validatedQuery);

  sendResponse(res, 200, "Attendance fetched", result);
};

export const mark = async (req, res) => {
  const attendance = await attendanceService.markAttendance(req.body);

  sendResponse(res, 200, "Attendance marked", { attendance });
};

export const clear = async (req, res) => {
  await attendanceService.clearAttendance(req.params.workerId, req.params.date);

  sendResponse(res, 200, "Attendance cleared", null);
};

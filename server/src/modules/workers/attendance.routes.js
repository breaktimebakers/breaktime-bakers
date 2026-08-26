import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validate, validateQuery } from "../../middlewares/validate.js";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { requireRole } from "../../middlewares/requireRole.js";
import { listAttendanceQuerySchema, markAttendanceSchema, clearAttendanceParamSchema } from "./attendance.validation.js";
import * as attendanceController from "./attendance.controller.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/", validateQuery(listAttendanceQuerySchema), asyncHandler(attendanceController.list));

router.post("/", validate(markAttendanceSchema), asyncHandler(attendanceController.mark));

router.delete(
  "/:workerId/:date",
  validate(clearAttendanceParamSchema, "params"),
  asyncHandler(attendanceController.clear),
);

export default router;

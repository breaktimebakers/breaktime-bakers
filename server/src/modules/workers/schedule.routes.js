import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validate, validateQuery } from "../../middlewares/validate.js";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { requireRole } from "../../middlewares/requireRole.js";
import { workerIdParamSchema, dayQuerySchema, dailyAssignmentSchema } from "./schedule.validation.js";
import * as scheduleController from "./schedule.controller.js";

const router = Router();
router.use(requireAuth, requireRole("admin"));
router.get("/", validateQuery(dayQuerySchema), asyncHandler(scheduleController.getDay));
router.get("/today", asyncHandler(scheduleController.getToday));
router.put("/assignment/:workerId", validate(workerIdParamSchema, "params"), validate(dailyAssignmentSchema), asyncHandler(scheduleController.setAssignment));
export default router;

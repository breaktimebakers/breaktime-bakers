import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validate, validateQuery } from "../../middlewares/validate.js";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { requireRole } from "../../middlewares/requireRole.js";
import {
  workerIdParamSchema,
  weekQuerySchema,
  saveWeeklyTemplateSchema,
  setOverrideSchema,
} from "./schedule.validation.js";
import * as scheduleController from "./schedule.controller.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/", validateQuery(weekQuerySchema), asyncHandler(scheduleController.getWeek));

router.get("/today", asyncHandler(scheduleController.getToday));

router.put(
  "/template/:workerId",
  validate(workerIdParamSchema, "params"),
  validate(saveWeeklyTemplateSchema),
  asyncHandler(scheduleController.saveTemplate),
);

router.patch(
  "/override/:workerId",
  validate(workerIdParamSchema, "params"),
  validate(setOverrideSchema),
  asyncHandler(scheduleController.setOverride),
);

export default router;

import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validate, validateQuery } from "../../middlewares/validate.js";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { requireRole } from "../../middlewares/requireRole.js";
import {
  driverIdParamSchema as scheduleDriverIdParamSchema,
  dayQuerySchema as scheduleDayQuerySchema,
  setDriverAreasSchema,
} from "./schedule.validation.js";
import { driverIdParamSchema, dayQuerySchema, statsQuerySchema } from "./driver.validation.js";
import { deliveryStatusQuerySchema } from "./status.validation.js";
import * as scheduleController from "./schedule.controller.js";
import * as driverController from "./driver.controller.js";
import * as statusController from "./status.controller.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/status", validateQuery(deliveryStatusQuerySchema), asyncHandler(statusController.list));
router.get("/schedule", validateQuery(scheduleDayQuerySchema), asyncHandler(scheduleController.getDay));
router.get("/schedule/today", asyncHandler(scheduleController.getToday));
router.put(
  "/schedule/:driverId",
  validate(scheduleDriverIdParamSchema, "params"),
  validate(setDriverAreasSchema),
  asyncHandler(scheduleController.setAreas),
);

router.get(
  "/drivers/:id/day",
  validate(driverIdParamSchema, "params"),
  validateQuery(dayQuerySchema),
  asyncHandler(driverController.getDay),
);
router.get(
  "/drivers/:id/stats",
  validate(driverIdParamSchema, "params"),
  validateQuery(statsQuerySchema),
  asyncHandler(driverController.getStats),
);

export default router;

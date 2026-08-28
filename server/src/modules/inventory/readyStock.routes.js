import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validate, validateQuery } from "../../middlewares/validate.js";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { requireRole } from "../../middlewares/requireRole.js";
import { listReadyStockQuerySchema, productIdParamSchema, listStockHistoryQuerySchema } from "./readyStock.validation.js";
import * as readyStockController from "./readyStock.controller.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/", validateQuery(listReadyStockQuerySchema), asyncHandler(readyStockController.list));

router.get(
  "/:id/history",
  validate(productIdParamSchema, "params"),
  validateQuery(listStockHistoryQuerySchema),
  asyncHandler(readyStockController.history),
);

export default router;

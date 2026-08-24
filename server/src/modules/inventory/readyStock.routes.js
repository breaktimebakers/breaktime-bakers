import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validateQuery } from "../../middlewares/validate.js";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { requireRole } from "../../middlewares/requireRole.js";
import { listReadyStockQuerySchema } from "./readyStock.validation.js";
import * as readyStockController from "./readyStock.controller.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/", validateQuery(listReadyStockQuerySchema), asyncHandler(readyStockController.list));

export default router;

import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validate } from "../../middlewares/validate.js";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { requireRole } from "../../middlewares/requireRole.js";
import { walkInSaleIdParamSchema, createWalkInSaleSchema } from "./walkInSale.validation.js";
import * as walkInSaleController from "./walkInSale.controller.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/", asyncHandler(walkInSaleController.list));

router.post("/", validate(createWalkInSaleSchema), asyncHandler(walkInSaleController.create));

router.patch("/:id/settle", validate(walkInSaleIdParamSchema, "params"), asyncHandler(walkInSaleController.settle));

export default router;

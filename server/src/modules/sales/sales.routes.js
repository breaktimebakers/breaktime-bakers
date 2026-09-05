import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { requireRole } from "../../middlewares/requireRole.js";
import * as salesController from "./sales.controller.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/overview", asyncHandler(salesController.overview));

export default router;

import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validate, validateQuery } from "../../middlewares/validate.js";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { requireRole } from "../../middlewares/requireRole.js";
import { listAdvanceQuerySchema, createAdvanceSchema, advanceIdParamSchema } from "./advance.validation.js";
import * as advanceController from "./advance.controller.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/", validateQuery(listAdvanceQuerySchema), asyncHandler(advanceController.list));

router.post("/", validate(createAdvanceSchema), asyncHandler(advanceController.create));

router.delete("/:id", validate(advanceIdParamSchema, "params"), asyncHandler(advanceController.remove));

export default router;

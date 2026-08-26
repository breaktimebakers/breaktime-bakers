import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validate } from "../../middlewares/validate.js";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { requireRole } from "../../middlewares/requireRole.js";
import { taxEntryIdParamSchema, createTaxEntrySchema } from "./taxEntry.validation.js";
import * as taxEntryController from "./taxEntry.controller.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/", asyncHandler(taxEntryController.list));

router.post("/", validate(createTaxEntrySchema), asyncHandler(taxEntryController.create));

router.delete("/:id", validate(taxEntryIdParamSchema, "params"), asyncHandler(taxEntryController.remove));

export default router;

import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validate, validateQuery } from "../../middlewares/validate.js";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { requireRole } from "../../middlewares/requireRole.js";
import { listBatchesQuerySchema, createBatchSchema, updateBatchSchema, batchIdParamSchema } from "./batch.validation.js";
import * as batchController from "./batch.controller.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/", validateQuery(listBatchesQuerySchema), asyncHandler(batchController.list));

router.post("/", validate(createBatchSchema), asyncHandler(batchController.create));

router.patch(
  "/:id",
  validate(batchIdParamSchema, "params"),
  validate(updateBatchSchema),
  asyncHandler(batchController.update),
);

export default router;

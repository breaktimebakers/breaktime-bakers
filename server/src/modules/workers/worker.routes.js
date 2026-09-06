import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validate, validateQuery } from "../../middlewares/validate.js";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { requireRole } from "../../middlewares/requireRole.js";
import {
  workerIdParamSchema,
  createWorkerSchema,
  updateWorkerSchema,
  listWorkersQuerySchema,
} from "./worker.validation.js";
import * as workerController from "./worker.controller.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/", validateQuery(listWorkersQuerySchema), asyncHandler(workerController.list));

router.get("/:id", validate(workerIdParamSchema, "params"), asyncHandler(workerController.getOne));

router.post("/", validate(createWorkerSchema), asyncHandler(workerController.create));

router.patch(
  "/:id",
  validate(workerIdParamSchema, "params"),
  validate(updateWorkerSchema),
  asyncHandler(workerController.update),
);

router.patch("/:id/leave", validate(workerIdParamSchema, "params"), asyncHandler(workerController.markLeft));

router.patch(
  "/:id/reactivate",
  validate(workerIdParamSchema, "params"),
  asyncHandler(workerController.reactivate),
);

router.delete("/:id", validate(workerIdParamSchema, "params"), asyncHandler(workerController.remove));

export default router;

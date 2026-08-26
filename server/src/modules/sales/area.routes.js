import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validate } from "../../middlewares/validate.js";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { requireRole } from "../../middlewares/requireRole.js";
import {
  areaIdParamSchema,
  createAreaSchema,
  updateAreaSchema,
  createStoreSchema,
} from "./area.validation.js";
import * as areaController from "./area.controller.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/", asyncHandler(areaController.list));

router.get("/:id", validate(areaIdParamSchema, "params"), asyncHandler(areaController.getOne));

router.post("/", validate(createAreaSchema), asyncHandler(areaController.create));

router.patch(
  "/:id",
  validate(areaIdParamSchema, "params"),
  validate(updateAreaSchema),
  asyncHandler(areaController.update),
);

router.get(
  "/:id/stores",
  validate(areaIdParamSchema, "params"),
  asyncHandler(areaController.listStores),
);

router.post(
  "/:id/stores",
  validate(areaIdParamSchema, "params"),
  validate(createStoreSchema),
  asyncHandler(areaController.createStore),
);

export default router;

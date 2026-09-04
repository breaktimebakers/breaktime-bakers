import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validate } from "../../middlewares/validate.js";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { requireRole } from "../../middlewares/requireRole.js";
import {
  storeIdParamSchema,
  updateStoreSchema,
  updateStoreStatusSchema,
  bulkAssignStoresSchema,
  bulkUnassignStoresSchema,
} from "./area.validation.js";
import * as areaController from "./area.controller.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/", asyncHandler(areaController.listAllStores));

router.get("/unassigned", asyncHandler(areaController.listUnassignedStores));

router.patch(
  "/bulk-assign",
  validate(bulkAssignStoresSchema),
  asyncHandler(areaController.bulkAssignStores),
);

router.patch(
  "/bulk-unassign",
  validate(bulkUnassignStoresSchema),
  asyncHandler(areaController.bulkUnassignStores),
);

router.patch(
  "/:id",
  validate(storeIdParamSchema, "params"),
  validate(updateStoreSchema),
  asyncHandler(areaController.updateStore),
);

router.patch(
  "/:id/status",
  validate(storeIdParamSchema, "params"),
  validate(updateStoreStatusSchema),
  asyncHandler(areaController.updateStoreStatus),
);

export default router;

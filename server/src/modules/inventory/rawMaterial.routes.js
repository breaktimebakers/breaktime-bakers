import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validate, validateQuery } from "../../middlewares/validate.js";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { requireRole } from "../../middlewares/requireRole.js";
import {
  listRawMaterialsQuerySchema,
  rawMaterialIdParamSchema,
  createRawMaterialSchema,
  updateRawMaterialSchema,
  listLotsQuerySchema,
  createLotSchema,
} from "./rawMaterial.validation.js";
import * as rawMaterialController from "./rawMaterial.controller.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/", validateQuery(listRawMaterialsQuerySchema), asyncHandler(rawMaterialController.list));

router.get(
  "/:id",
  validate(rawMaterialIdParamSchema, "params"),
  asyncHandler(rawMaterialController.getOne),
);

router.post("/", validate(createRawMaterialSchema), asyncHandler(rawMaterialController.create));

router.patch(
  "/:id",
  validate(rawMaterialIdParamSchema, "params"),
  validate(updateRawMaterialSchema),
  asyncHandler(rawMaterialController.update),
);

router.delete(
  "/:id",
  validate(rawMaterialIdParamSchema, "params"),
  asyncHandler(rawMaterialController.remove),
);

router.get(
  "/:id/lots",
  validate(rawMaterialIdParamSchema, "params"),
  validateQuery(listLotsQuerySchema),
  asyncHandler(rawMaterialController.listLots),
);

router.post(
  "/:id/lots",
  validate(rawMaterialIdParamSchema, "params"),
  validate(createLotSchema),
  asyncHandler(rawMaterialController.createLot),
);

export default router;

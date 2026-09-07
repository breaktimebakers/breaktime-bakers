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
  lotWastageParamSchema,
  createWastageSchema,
  listAllLotsQuerySchema,
  lotPaymentParamSchema,
  updateLotPaymentSchema,
} from "./rawMaterial.validation.js";
import * as rawMaterialController from "./rawMaterial.controller.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/", validateQuery(listRawMaterialsQuerySchema), asyncHandler(rawMaterialController.list));

// Supplier Payments (Finance) - lots across every material. Registered
// before "/:id" so "lots" is never swallowed as a raw material id.
router.get(
  "/lots",
  validateQuery(listAllLotsQuerySchema),
  asyncHandler(rawMaterialController.listAllLots),
);

router.patch(
  "/lots/:lotId/payment",
  validate(lotPaymentParamSchema, "params"),
  validate(updateLotPaymentSchema),
  asyncHandler(rawMaterialController.updateLotPayment),
);

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

router.post(
  "/:id/lots/:lotId/wastage",
  validate(lotWastageParamSchema, "params"),
  validate(createWastageSchema),
  asyncHandler(rawMaterialController.createWastage),
);

export default router;

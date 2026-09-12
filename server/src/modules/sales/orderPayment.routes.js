import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validate, validateQuery } from "../../middlewares/validate.js";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { requireRole } from "../../middlewares/requireRole.js";
import { recordPaymentSchema, listForOrderQuerySchema, storeIdParamSchema, areaIdParamSchema, areaStoreSummariesQuerySchema } from "./orderPayment.validation.js";
import * as orderPaymentController from "./orderPayment.controller.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/overview", asyncHandler(orderPaymentController.overview));

router.get("/areas", asyncHandler(orderPaymentController.areas));

router.get(
  "/areas/:areaId/stores",
  validate(areaIdParamSchema, "params"),
  validateQuery(areaStoreSummariesQuerySchema),
  asyncHandler(orderPaymentController.areaStores),
);

router.get(
  "/stores/:storeId",
  validate(storeIdParamSchema, "params"),
  asyncHandler(orderPaymentController.storeDetail),
);

router.get("/", validateQuery(listForOrderQuerySchema), asyncHandler(orderPaymentController.listForOrder));

router.post("/", validate(recordPaymentSchema), asyncHandler(orderPaymentController.record));

export default router;

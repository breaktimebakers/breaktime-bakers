import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validate, validateQuery } from "../../middlewares/validate.js";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { requireRole } from "../../middlewares/requireRole.js";
import {
  listOrdersQuerySchema,
  orderIdParamSchema,
  createOrderSchema,
  updateOrderStatusSchema,
  fulfillOrderSchema,
} from "./order.validation.js";
import * as orderController from "./order.controller.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/", validateQuery(listOrdersQuerySchema), asyncHandler(orderController.list));

router.post("/", validate(createOrderSchema), asyncHandler(orderController.create));

router.patch(
  "/:id/status",
  validate(orderIdParamSchema, "params"),
  validate(updateOrderStatusSchema),
  asyncHandler(orderController.updateStatus),
);

router.patch(
  "/:id/fulfill",
  validate(orderIdParamSchema, "params"),
  validate(fulfillOrderSchema),
  asyncHandler(orderController.fulfill),
);

export default router;

import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validate, validateQuery } from "../../middlewares/validate.js";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { requireRole } from "../../middlewares/requireRole.js";
import { payrollQuerySchema, markPaidSchema, bulkMarkPaidSchema, unmarkParamSchema } from "./salaryPayment.validation.js";
import * as salaryPaymentController from "./salaryPayment.controller.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/", asyncHandler(salaryPaymentController.list));

router.get("/payroll", validateQuery(payrollQuerySchema), asyncHandler(salaryPaymentController.payroll));

router.post("/", validate(markPaidSchema), asyncHandler(salaryPaymentController.markPaid));

router.post("/bulk", validate(bulkMarkPaidSchema), asyncHandler(salaryPaymentController.bulkMarkPaid));

router.delete(
  "/:workerId/:year/:month",
  validate(unmarkParamSchema, "params"),
  asyncHandler(salaryPaymentController.markUnpaid),
);

export default router;

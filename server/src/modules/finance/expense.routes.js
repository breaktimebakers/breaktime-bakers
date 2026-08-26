import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validate } from "../../middlewares/validate.js";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { requireRole } from "../../middlewares/requireRole.js";
import { expenseIdParamSchema, createExpenseSchema } from "./expense.validation.js";
import * as expenseController from "./expense.controller.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/", asyncHandler(expenseController.list));

router.post("/", validate(createExpenseSchema), asyncHandler(expenseController.create));

router.delete("/:id", validate(expenseIdParamSchema, "params"), asyncHandler(expenseController.remove));

export default router;

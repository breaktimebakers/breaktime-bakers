import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validate } from "../../middlewares/validate.js";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { requireRole } from "../../middlewares/requireRole.js";
import { userIdParamSchema, changePasswordSchema } from "./user.validation.js";
import * as userController from "./user.controller.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/", asyncHandler(userController.list));

router.patch(
  "/:id/password",
  validate(userIdParamSchema, "params"),
  validate(changePasswordSchema),
  asyncHandler(userController.changePassword),
);

router.delete("/:id", validate(userIdParamSchema, "params"), asyncHandler(userController.remove));

export default router;

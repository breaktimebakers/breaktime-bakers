import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validate } from "../../middlewares/validate.js";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { requireRole } from "../../middlewares/requireRole.js";
import { createUploadUrlSchema } from "./upload.validation.js";
import * as uploadController from "./upload.controller.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.post(
  "/receipt-url",
  validate(createUploadUrlSchema),
  asyncHandler(uploadController.createUploadUrl),
);

export default router;

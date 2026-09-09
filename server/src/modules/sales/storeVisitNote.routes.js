import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validate, validateQuery } from "../../middlewares/validate.js";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { requireRole } from "../../middlewares/requireRole.js";
import { createStoreVisitNoteSchema, listStoreVisitNotesQuerySchema } from "./storeVisitNote.validation.js";
import * as storeVisitNoteController from "./storeVisitNote.controller.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/", validateQuery(listStoreVisitNotesQuerySchema), asyncHandler(storeVisitNoteController.list));

router.post("/", validate(createStoreVisitNoteSchema), asyncHandler(storeVisitNoteController.create));

export default router;

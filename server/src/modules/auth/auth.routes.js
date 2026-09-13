import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validate } from "../../middlewares/validate.js";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { requireRole } from "../../middlewares/requireRole.js";
import { createRateLimiter } from "../../utils/rateLimiter.js";
import { registerSchema, loginSchema } from "./auth.validation.js";
import * as authController from "./auth.controller.js";

const router = Router();

// Broad throttle across all auth routes, keyed by IP.
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyGenerator: (req) => `auth:${req.ip}`,
});

// Tighter throttle on login, keyed by IP + email so one attacker
// can't brute-force a single account by rotating IPs alone, and
// one IP can't brute-force many accounts either.
const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 8,
  keyGenerator: (req) => `login:${req.ip}:${req.body?.email ?? ""}`,
});

router.use(authLimiter);

// Not a public sign-up route: this app is admin-only, and the only way
// to create another admin login is to already be one.
router.post(
  "/register",
  requireAuth,
  requireRole("admin"),
  validate(registerSchema),
  asyncHandler(authController.register),
);
router.post(
  "/login",
  loginLimiter,
  validate(loginSchema),
  asyncHandler(authController.login),
);
router.post("/logout", asyncHandler(authController.logout));
router.post("/refresh-token", asyncHandler(authController.rotateToken));

router.get("/me", requireAuth, asyncHandler(authController.getCurrentUser));

export default router;

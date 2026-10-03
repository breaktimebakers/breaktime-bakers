import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validate } from "../../middlewares/validate.js";
import { requireAuth } from "../../middlewares/requireAuth.js";
import { requireRole } from "../../middlewares/requireRole.js";
import { createRateLimiter } from "../../utils/rateLimiter.js";
import { registerSchema, loginSchema } from "./auth.validation.js";
import * as authController from "./auth.controller.js";

const router = Router();

const WINDOW_MS = 15 * 60 * 1000;

const normalizeEmail = (req) => String(req.body?.email ?? "").trim().toLowerCase();

// Login throttles count failed attempts only, so legitimately signing in
// from several devices never locks anyone out. Two independent limits:
// - per IP: one IP can't brute-force many accounts
// - per email (any IP): one account can't be brute-forced by rotating IPs
// The email is trimmed + lowercased so "Admin@x.com" can't dodge the limit.
const loginIpLimiter = createRateLimiter({
  windowMs: WINDOW_MS,
  max: 30,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `login-ip:${req.ip}`,
});

const loginEmailLimiter = createRateLimiter({
  windowMs: WINDOW_MS,
  max: 8,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `login-email:${normalizeEmail(req)}`,
});

// Refresh is called automatically by the app (every ~15m per open tab, plus
// retries after a 401), so it gets a roomy limit - just enough to stop abuse,
// never enough to log a legitimate shared-IP office out.
const refreshLimiter = createRateLimiter({
  windowMs: WINDOW_MS,
  max: 120,
  keyGenerator: (req) => `refresh:${req.ip}`,
});

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
  loginIpLimiter,
  loginEmailLimiter,
  validate(loginSchema),
  asyncHandler(authController.login),
);
router.post("/logout", asyncHandler(authController.logout));
router.post("/refresh-token", refreshLimiter, asyncHandler(authController.rotateToken));

router.get("/me", requireAuth, asyncHandler(authController.getCurrentUser));

export default router;

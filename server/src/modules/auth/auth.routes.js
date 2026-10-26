import { Router } from "express";
import * as authController from "./auth.controller.js";
import {
  forgotPasswordSchema,
  completeProfileSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  sendVerificationCodeSchema,
  suspensionAppealSchema,
} from "./auth.validation.js";
import { authenticate } from "../../shared/middleware/authenticate.js";
import {
  authRateLimiter,
  passwordResetRateLimiter,
  suspensionAppealRateLimiter,
  verificationCodeRateLimiter,
} from "../../shared/middleware/rateLimiter.js";
import { validate } from "../../shared/middleware/validate.js";

const router = Router();

router.post(
  "/send-verification-code",
  verificationCodeRateLimiter,
  validate(sendVerificationCodeSchema),
  authController.sendVerificationCode,
);
router.post(
  "/register",
  authRateLimiter,
  validate(registerSchema),
  authController.register,
);
router.post(
  "/login",
  authRateLimiter,
  validate(loginSchema),
  authController.login,
);
router.post(
  "/suspension-appeals",
  suspensionAppealRateLimiter,
  validate(suspensionAppealSchema),
  authController.submitSuspensionAppeal,
);
router.post("/logout", authenticate, authController.logout);
router.post(
  "/forgot-password",
  passwordResetRateLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword,
);
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  authController.resetPassword,
);
router.get("/verify-reset-token", authController.verifyResetToken);
router.get("/me", authenticate, authController.me);
router.post(
  "/complete-profile",
  authenticate,
  validate(completeProfileSchema),
  authController.completeProfile,
);

export default router;

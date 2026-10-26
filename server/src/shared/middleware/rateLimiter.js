import rateLimit from "express-rate-limit";
import { config } from "../config/index.js";

const makeLimiter = (windowMs, limit) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
      error: { message: "Too many requests. Please try again later." },
    },
  });

export const generalRateLimiter = makeLimiter(
  config.RATE_LIMIT_WINDOW_MS,
  config.RATE_LIMIT_MAX,
);
export const authRateLimiter = makeLimiter(15 * 60 * 1000, 10);
export const suspensionAppealRateLimiter = makeLimiter(60 * 60 * 1000, 5);
export const passwordResetRateLimiter = makeLimiter(15 * 60 * 1000, 3);
export const verificationCodeRateLimiter = makeLimiter(15 * 60 * 1000, 5);
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => req.user.id,
  message: { error: { message: "Too many requests. Please try again later." } },
});

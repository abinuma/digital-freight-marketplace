import { Router } from "express";
import * as userController from "./user.controller.js";
import { authorize } from "../../shared/middleware/authorize.js";
import { uploadRateLimiter } from "../../shared/middleware/rateLimiter.js";
import { validate } from "../../shared/middleware/validate.js";
import { AppError } from "../../shared/utils/AppError.js";
import { parseProfilePhoto } from "./profile-photo.upload.js";
import { parseVehiclePhoto } from "./vehicle-photo.upload.js";
import {
  paginationQuerySchema,
  updateProfileSchema,
  availableTransportersQuerySchema,
  updateAvailabilitySchema,
  upsertVehicleSchema,
  userIdParamsSchema,
} from "./user.validation.js";

const router = Router();

function requireProfileOwner(req, res, next) {
  if (req.params.id !== req.user.id)
    return next(new AppError("You can only update your own profile", 403));
  return next();
}

router.get(
  "/:id/reviews",
  validate(paginationQuerySchema),
  userController.getReviews,
);
router.get(
  "/available-transporters",
  authorize("SHIPPER"),
  validate(availableTransportersQuerySchema),
  userController.listAvailableTransporters,
);
router.patch(
  "/:id/availability",
  authorize("TRANSPORTER"),
  validate(updateAvailabilitySchema),
  requireProfileOwner,
  userController.setLoadAvailability,
);
router.get(
  "/:id/vehicle",
  validate(userIdParamsSchema),
  userController.getVehicle,
);
router.put(
  "/:id/vehicle",
  authorize("TRANSPORTER"),
  validate(upsertVehicleSchema),
  userController.updateVehicle,
);
router.post(
  "/:id/vehicle-photo",
  authorize("TRANSPORTER"),
  validate(userIdParamsSchema),
  requireProfileOwner,
  uploadRateLimiter,
  parseVehiclePhoto,
  userController.uploadVehiclePhoto,
);
router.post(
  "/:id/profile-photo",
  validate(userIdParamsSchema),
  requireProfileOwner,
  uploadRateLimiter,
  parseProfilePhoto,
  userController.uploadProfilePhoto,
);
router.get("/:id", validate(userIdParamsSchema), userController.getProfile);
router.patch(
  "/:id",
  validate(updateProfileSchema),
  userController.updateProfile,
);

export default router;

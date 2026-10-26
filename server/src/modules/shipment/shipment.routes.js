import { Router } from "express";
import * as shipmentController from "./shipment.controller.js";
import * as reviewController from "./review.controller.js";
import { authorize } from "../../shared/middleware/authorize.js";
import { validate } from "../../shared/middleware/validate.js";
import { uploadRateLimiter } from "../../shared/middleware/rateLimiter.js";
import { parseShipmentImages } from "./shipment.upload.js";
import {
  createShipmentSchema,
  shipmentIdParamsSchema,
  shipmentListQuerySchema,
  shipmentImageParamsSchema,
  updateShipmentSchema,
} from "./shipment.validation.js";
import {
  createShipmentReviewSchema,
  shipmentReviewsSchema,
} from "./review.validation.js";

const router = Router();

router.get(
  "/dashboard/summary",
  authorize("SHIPPER"),
  shipmentController.getShipperDashboardSummary,
);
router.post(
  "/",
  authorize("SHIPPER"),
  validate(createShipmentSchema),
  shipmentController.createShipment,
);
router.get(
  "/",
  validate(shipmentListQuerySchema),
  shipmentController.listShipments,
);
router.post(
  "/:shipmentId/reviews",
  validate(createShipmentReviewSchema),
  reviewController.createShipmentReview,
);
router.get(
  "/:shipmentId/reviews",
  validate(shipmentReviewsSchema),
  reviewController.listShipmentReviews,
);
router.get(
  "/:id",
  validate(shipmentIdParamsSchema),
  shipmentController.getShipment,
);
router.patch(
  "/:id",
  authorize("SHIPPER"),
  validate(updateShipmentSchema),
  shipmentController.updateShipment,
);
router.patch(
  "/:id/cancel",
  authorize("SHIPPER"),
  validate({ params: shipmentIdParamsSchema.params }),
  shipmentController.cancelShipment,
);
router.patch(
  "/:id/complete",
  authorize("SHIPPER"),
  validate({ params: shipmentIdParamsSchema.params }),
  shipmentController.completeShipment,
);
router.post(
  "/:id/images",
  authorize("SHIPPER"),
  validate({ params: shipmentIdParamsSchema.params }),
  uploadRateLimiter,
  parseShipmentImages,
  shipmentController.uploadImages,
);
router.delete(
  "/:id/images/:imageId",
  authorize("SHIPPER"),
  validate(shipmentImageParamsSchema),
  shipmentController.removeImage,
);

export default router;

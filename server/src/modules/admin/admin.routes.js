import { Router } from "express";
import * as adminController from "./admin.controller.js";
import { authorize } from "../../shared/middleware/authorize.js";
import { validate } from "../../shared/middleware/validate.js";
import {
  adminShipmentListSchema,
  adminShipmentRemoveSchema,
  adminUserListSchema,
  adminUserParamsSchema,
  adminUserSuspendSchema,
  adminSuspensionAppealListSchema,
} from "./admin.validation.js";

const router = Router();

router.get(
  "/admin/users",
  authorize("ADMIN"),
  validate(adminUserListSchema),
  adminController.listUsers,
);
router.get(
  "/admin/suspension-appeals",
  authorize("ADMIN"),
  validate(adminSuspensionAppealListSchema),
  adminController.listSuspensionAppeals,
);
router.patch(
  "/admin/users/:id/suspend",
  authorize("ADMIN"),
  validate(adminUserSuspendSchema),
  adminController.suspendUser,
);
router.patch(
  "/admin/users/:id/activate",
  authorize("ADMIN"),
  validate(adminUserParamsSchema),
  adminController.activateUser,
);
router.get("/admin/metrics", authorize("ADMIN"), adminController.getMetrics);
router.get(
  "/admin/shipments",
  authorize("ADMIN"),
  validate(adminShipmentListSchema),
  adminController.listShipments,
);
router.patch(
  "/admin/shipments/:id/remove",
  authorize("ADMIN"),
  validate(adminShipmentRemoveSchema),
  adminController.removeShipment,
);

export default router;

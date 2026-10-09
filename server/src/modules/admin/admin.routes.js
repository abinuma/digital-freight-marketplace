import { Router } from 'express';
import * as adminController from './admin.controller.js';
import { authorize } from '../../shared/middleware/authorize.js';
import { validate } from '../../shared/middleware/validate.js';
import { adminShipmentListSchema, adminShipmentParamsSchema } from './admin.validation.js';

const router = Router();

router.get('/admin/shipments', authorize('ADMIN'), validate(adminShipmentListSchema), adminController.listShipments);
router.patch(
  '/admin/shipments/:id/remove',
  authorize('ADMIN'),
  validate(adminShipmentParamsSchema),
  adminController.removeShipment,
);

export default router;

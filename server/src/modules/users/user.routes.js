import { Router } from 'express';
import * as userController from './user.controller.js';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';
import { validate } from '../../shared/middleware/validate.js';
import {
  paginationQuerySchema,
  updateProfileSchema,
  upsertVehicleSchema,
  userIdParamsSchema,
} from './user.validation.js';

const router = Router();

router.use(authenticate);
router.get('/:id/reviews', validate(paginationQuerySchema), userController.getReviews);
router.get('/:id/vehicle', validate(userIdParamsSchema), userController.getVehicle);
router.put('/:id/vehicle', authorize('TRANSPORTER'), validate(upsertVehicleSchema), userController.updateVehicle);
router.get('/:id', validate(userIdParamsSchema), userController.getProfile);
router.patch('/:id', validate(updateProfileSchema), userController.updateProfile);

export default router;

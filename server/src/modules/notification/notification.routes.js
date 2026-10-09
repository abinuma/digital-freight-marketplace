import { Router } from 'express';
import * as notificationController from './notification.controller.js';
import { validate } from '../../shared/middleware/validate.js';
import { notificationListSchema, notificationParamsSchema } from './notification.validation.js';

const router = Router();

router.get('/', validate(notificationListSchema), notificationController.listNotifications);
router.patch('/read-all', notificationController.markAllNotificationsRead);
router.patch('/:id/read', validate(notificationParamsSchema), notificationController.markNotificationRead);

export default router;

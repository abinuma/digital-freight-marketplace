import { Router } from 'express';
import * as messagingController from './messaging.controller.js';
import { validate } from '../../shared/middleware/validate.js';
import { createMessageSchema, shipmentMessagesSchema } from './messaging.validation.js';

const router = Router();

router.get('/shipments/:shipmentId/messages', validate(shipmentMessagesSchema), messagingController.listMessages);
router.post('/shipments/:shipmentId/messages', validate(createMessageSchema), messagingController.sendMessage);

export default router;

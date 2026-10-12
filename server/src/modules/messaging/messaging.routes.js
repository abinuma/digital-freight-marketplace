import { Router } from 'express';
import * as messagingController from './messaging.controller.js';
import { validate } from '../../shared/middleware/validate.js';
import { conversationMessagesSchema, createMessageSchema } from './messaging.validation.js';

const router = Router();

router.get('/messages/conversations', messagingController.listConversations);
router.get('/messages/conversations/:conversationId', validate(conversationMessagesSchema), messagingController.listMessages);
router.post('/messages/conversations/:conversationId', validate(createMessageSchema), messagingController.sendMessage);

export default router;

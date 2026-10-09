import * as messagingService from './messaging.service.js';

export async function listMessages(req, res, next) {
  try {
    const messages = await messagingService.listMessages(req.user, req.params.shipmentId);
    return res.json({ data: messages });
  } catch (error) {
    return next(error);
  }
}

export async function sendMessage(req, res, next) {
  try {
    const message = await messagingService.sendMessage(req.user, req.params.shipmentId, req.body.content);
    return res.status(201).json({ data: message });
  } catch (error) {
    return next(error);
  }
}

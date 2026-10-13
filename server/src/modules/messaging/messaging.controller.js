import * as messagingService from './messaging.service.js';

export async function listConversations(req, res, next) {
  try {
    const conversations = await messagingService.listConversations(req.user);
    return res.json({ data: conversations });
  } catch (error) {
    return next(error);
  }
}

export async function listMessages(req, res, next) {
  try {
    const messages = await messagingService.listMessages(req.user, req.params.conversationId);
    return res.json({ data: messages });
  } catch (error) {
    return next(error);
  }
}

export async function getLastMessage(req, res, next) {
  try {
    const message = await messagingService.getLastMessage(req.user, req.params.conversationId);
    return res.json({ data: message });
  } catch (error) {
    return next(error);
  }
}

export async function listConversationBids(req, res, next) {
  try {
    const bids = await messagingService.listConversationBids(req.user, req.params.conversationId);
    return res.json({ data: bids });
  } catch (error) {
    return next(error);
  }
}

export async function sendMessage(req, res, next) {
  try {
    const message = await messagingService.sendMessage(req.user, req.params.conversationId, req.body.content);
    return res.status(201).json({ data: message });
  } catch (error) {
    return next(error);
  }
}

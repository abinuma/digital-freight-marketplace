import { AppError } from '../../shared/utils/AppError.js';
import * as messagingRepository from './messaging.repository.js';
import * as notificationService from '../notification/notification.service.js';

function serializeConversation(conversation, user) {
  const counterpart = user.role === 'SHIPPER' ? conversation.transporter : conversation.shipper;
  const { image, ...profile } = counterpart;

  return {
    id: conversation.id,
    shipperId: conversation.shipperId,
    transporterId: conversation.transporterId,
    shipmentIds: conversation.shipmentIds,
    updatedAt: conversation.updatedAt,
    counterpart: { ...profile, profilePhoto: image },
    lastMessage: conversation.messages[0] || null,
  };
}

function isParticipant(user, conversation) {
  return (user.role === 'SHIPPER' && conversation.shipperId === user.id)
    || (user.role === 'TRANSPORTER' && conversation.transporterId === user.id);
}

async function getParticipantConversation(user, conversationId) {
  const conversation = await messagingRepository.findConversation(conversationId);
  if (!conversation) throw new AppError('Conversation was not found', 404);
  if (!isParticipant(user, conversation)) throw new AppError('You are not authorized to access this conversation', 403);
  return conversation;
}

export async function listConversations(user) {
  if (!['SHIPPER', 'TRANSPORTER'].includes(user.role)) {
    throw new AppError('Only Shippers and Transporters can view conversations', 403);
  }
  const conversations = await messagingRepository.listConversations(user);
  return conversations.map((conversation) => serializeConversation(conversation, user));
}

export async function startConversation(user, transporterId) {
  if (user.role !== 'SHIPPER') throw new AppError('Only Shippers can contact a Transporter', 403);
  if (user.id === transporterId) throw new AppError('You cannot contact yourself', 400);
  const transporter = await messagingRepository.findActiveTransporter(transporterId);
  if (!transporter) throw new AppError('Transporter was not found', 404);
  return messagingRepository.findOrCreateConversation(user.id, transporterId);
}

export async function listConversationBids(user, conversationId) {
  const conversation = await getParticipantConversation(user, conversationId);
  const bids = await messagingRepository.findConversationBids(conversation);
  return bids.map((bid) => ({ ...bid, price: Number(bid.price), shipment: { ...bid.shipment, weightKg: Number(bid.shipment.weightKg) } }));
}

export async function listMessages(user, conversationId) {
  await getParticipantConversation(user, conversationId);
  await notificationService.markNotificationsReadByReference(user.id, conversationId);
  return messagingRepository.findConversationMessages(conversationId);
}

export async function getLastMessage(user, conversationId) {
  await getParticipantConversation(user, conversationId);
  return messagingRepository.findConversationLastMessage(conversationId);
}

export async function sendMessage(user, conversationId, content) {
  const conversation = await getParticipantConversation(user, conversationId);
  const message = await messagingRepository.createMessage(conversation.id, user.id, content);
  await notificationService.newMessage(conversation.id, user.id, content);
  return message;
}

import { AppError } from '../../shared/utils/AppError.js';
import * as messagingRepository from './messaging.repository.js';
import * as notificationService from '../notification/notification.service.js';

function serializeConversation(conversation, user) {
  const bid = conversation.shipment.bids.find(({ transporterId }) => transporterId === conversation.transporterId);
  const canSend = ['PENDING', 'ACCEPTED'].includes(bid?.status);
  const counterpart = user.role === 'SHIPPER' ? conversation.transporter : conversation.shipment.shipper;
  const { image, ...profile } = counterpart;
  const shipment = {
    id: conversation.shipment.id,
    goodsDescription: conversation.shipment.goodsDescription,
    goodsType: conversation.shipment.goodsType,
    pickupLocation: conversation.shipment.pickupLocation,
    deliveryLocation: conversation.shipment.deliveryLocation,
    pickupDate: conversation.shipment.pickupDate,
    status: conversation.shipment.status,
  };

  return {
    id: conversation.id,
    shipmentId: conversation.shipmentId,
    transporterId: conversation.transporterId,
    updatedAt: conversation.updatedAt,
    counterpart: { ...profile, profilePhoto: image },
    shipment,
    bidStatus: bid?.status ?? null,
    canSend,
    lastMessage: conversation.messages[0] || null,
  };
}

function isParticipant(user, conversation) {
  return (user.role === 'SHIPPER' && conversation.shipment.shipperId === user.id)
    || (user.role === 'TRANSPORTER' && conversation.transporterId === user.id);
}

async function getParticipantConversation(user, conversationId) {
  const conversation = await messagingRepository.findConversation(conversationId);
  if (!conversation || conversation.shipment.removedAt) throw new AppError('Conversation was not found', 404);
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

export async function listMessages(user, conversationId) {
  await getParticipantConversation(user, conversationId);
  return messagingRepository.findConversationMessages(conversationId);
}

export async function sendMessage(user, conversationId, content) {
  const conversation = await getParticipantConversation(user, conversationId);
  const bid = conversation.shipment.bids.find(({ transporterId }) => transporterId === conversation.transporterId);
  if (!['PENDING', 'ACCEPTED'].includes(bid?.status)) {
    throw new AppError('This conversation is closed because the bid is no longer active', 409);
  }

  const message = await messagingRepository.createMessage(conversation.id, conversation.shipmentId, user.id, content);
  await notificationService.newMessage(conversation.id, conversation.shipmentId, conversation.transporterId, user.id, content);
  return message;
}

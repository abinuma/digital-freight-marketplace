import { AppError } from "../../shared/utils/AppError.js";
import * as messagingRepository from "./messaging.repository.js";
import * as notificationService from "../notification/notification.service.js";

function serializeConversation(conversation, user) {
  const isShipper = user.role?.toUpperCase() === "SHIPPER";
  const counterpart = isShipper
    ? conversation.transporter
    : conversation.shipper;
  const photo = counterpart?.image || counterpart?.profilePhoto || null;
  const { image: _img, profilePhoto: _pPhoto, ...profile } = counterpart || {};

  return {
    id: conversation.id,
    shipperId: conversation.shipperId,
    transporterId: conversation.transporterId,
    shipmentIds: conversation.shipmentIds,
    updatedAt: conversation.updatedAt,
    counterpart: { ...profile, profilePhoto: photo, image: photo },
    lastMessage: conversation.messages?.[0] || null,
  };
}

function isParticipant(user, conversation) {
  return (
    (user.role === "SHIPPER" && conversation.shipperId === user.id) ||
    (user.role === "TRANSPORTER" && conversation.transporterId === user.id)
  );
}

async function getParticipantConversation(user, conversationId) {
  const conversation =
    await messagingRepository.findConversation(conversationId);
  if (!conversation) throw new AppError("Conversation was not found", 404);
  if (!isParticipant(user, conversation))
    throw new AppError(
      "You are not authorized to access this conversation",
      403,
    );
  return conversation;
}

export async function listConversations(user) {
  if (!["SHIPPER", "TRANSPORTER"].includes(user.role)) {
    throw new AppError(
      "Only Shippers and Transporters can view conversations",
      403,
    );
  }
  const conversations = await messagingRepository.listConversations(user);
  return conversations.map((conversation) =>
    serializeConversation(conversation, user),
  );
}

export async function startConversation(user, input) {
  const transporterId =
    typeof input === "string" ? input : input?.transporterId;
  const shipperId = typeof input === "object" ? input?.shipperId : undefined;

  if (user.role === "SHIPPER") {
    if (!transporterId) throw new AppError("Transporter ID is required", 400);
    if (user.id === transporterId)
      throw new AppError("You cannot contact yourself", 400);
    const transporter =
      await messagingRepository.findActiveTransporter(transporterId);
    if (!transporter) throw new AppError("Transporter was not found", 404);
    return messagingRepository.findOrCreateConversation(user.id, transporterId);
  }

  if (user.role === "TRANSPORTER") {
    if (!shipperId) throw new AppError("Shipper ID is required", 400);
    if (user.id === shipperId)
      throw new AppError("You cannot contact yourself", 400);
    const shipper = await messagingRepository.findActiveShipper(shipperId);
    if (!shipper) throw new AppError("Shipper was not found", 404);
    return messagingRepository.findOrCreateConversation(shipperId, user.id);
  }

  throw new AppError(
    "Only Shippers and Transporters can start conversations",
    403,
  );
}

export async function listConversationBids(user, conversationId) {
  const conversation = await getParticipantConversation(user, conversationId);
  const bids = await messagingRepository.findConversationBids(conversation);
  return bids.map((bid) => {
    const shipperPhoto =
      bid.shipment?.shipper?.image ||
      bid.shipment?.shipper?.profilePhoto ||
      null;
    return {
      ...bid,
      price: Number(bid.price),
      shipment: {
        ...bid.shipment,
        weightKg:
          bid.shipment.weightKg == null ? null : Number(bid.shipment.weightKg),
        shipper: bid.shipment?.shipper
          ? {
              ...bid.shipment.shipper,
              profilePhoto: shipperPhoto,
              image: shipperPhoto,
            }
          : null,
      },
    };
  });
}

export async function listMessages(user, conversationId) {
  await getParticipantConversation(user, conversationId);
  await notificationService.markNotificationsReadByReference(
    user.id,
    conversationId,
  );
  return messagingRepository.findConversationMessages(conversationId);
}

export async function getLastMessage(user, conversationId) {
  await getParticipantConversation(user, conversationId);
  return messagingRepository.findConversationLastMessage(conversationId);
}

export async function sendMessage(user, conversationId, content) {
  const conversation = await getParticipantConversation(user, conversationId);
  const message = await messagingRepository.createMessage(
    conversation.id,
    user.id,
    content,
  );
  await notificationService.newMessage(conversation.id, user.id);
  return message;
}

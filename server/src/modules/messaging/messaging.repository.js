import { prisma } from '../../shared/db/prisma.js';

const messageSelect = {
  id: true,
  conversationId: true,
  shipmentId: true,
  senderId: true,
  content: true,
  createdAt: true,
};

const conversationSelect = {
  id: true,
  shipmentId: true,
  transporterId: true,
  updatedAt: true,
  transporter: { select: { id: true, name: true, image: true } },
  shipment: {
    select: {
      id: true,
      shipperId: true,
      goodsDescription: true,
      goodsType: true,
      pickupLocation: true,
      deliveryLocation: true,
      pickupDate: true,
      status: true,
      removedAt: true,
      shipper: { select: { id: true, name: true, image: true } },
      bids: {
        select: { transporterId: true, status: true },
        orderBy: { updatedAt: 'desc' },
      },
    },
  },
  messages: { take: 1, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], select: messageSelect },
};

export function listConversations(user) {
  return prisma.conversation.findMany({
    where: user.role === 'SHIPPER'
      ? { shipment: { shipperId: user.id, removedAt: null } }
      : { transporterId: user.id, shipment: { removedAt: null } },
    select: conversationSelect,
    orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
  });
}

export function findConversation(id) {
  return prisma.conversation.findUnique({ where: { id }, select: conversationSelect });
}

export function findConversationMessages(conversationId) {
  return prisma.message.findMany({
    where: { conversationId },
    select: messageSelect,
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });
}

export function createMessage(conversationId, shipmentId, senderId, content) {
  return prisma.$transaction(async (transaction) => {
    const message = await transaction.message.create({
      data: { conversationId, shipmentId, senderId, content },
      select: messageSelect,
    });
    await transaction.conversation.update({ where: { id: conversationId }, data: { updatedAt: message.createdAt } });
    return message;
  });
}

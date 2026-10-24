import { prisma } from '../../shared/db/prisma.js';

const messageSelect = {
  id: true,
  conversationId: true,
  senderId: true,
  content: true,
  createdAt: true,
};

const conversationSelect = {
  id: true,
  shipperId: true,
  transporterId: true,
  updatedAt: true,
  shipper: { select: { id: true, name: true, image: true, location: true, city: true, phone: true } },
  transporter: { select: { id: true, name: true, image: true, location: true, city: true, phone: true } },
};

export async function listConversations(user) {
  const conversations = await prisma.conversation.findMany({
    where: user.role === 'SHIPPER' ? { shipperId: user.id } : { transporterId: user.id },
    select: conversationSelect,
    orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
  });

  if (!conversations.length) return [];
  const conversationIds = conversations.map(({ id }) => id);

  const [bids, messages] = await Promise.all([
    prisma.bid.findMany({
      where: user.role === 'SHIPPER'
        ? { shipment: { shipperId: user.id }, transporterId: { in: conversations.map(({ transporterId }) => transporterId) } }
        : { transporterId: user.id, shipment: { shipperId: { in: conversations.map(({ shipperId }) => shipperId) } } },
      select: {
        shipmentId: true,
        transporterId: true,
        shipment: { select: { shipperId: true } },
      },
    }),
    prisma.message.findMany({
      where: { conversationId: { in: conversationIds } },
      select: messageSelect,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    }),
  ]);
  const shipmentIdsByPair = new Map();
  for (const bid of bids) {
    const pairKey = `${bid.shipment.shipperId}:${bid.transporterId}`;
    const shipmentIds = shipmentIdsByPair.get(pairKey) || new Set();
    shipmentIds.add(bid.shipmentId);
    shipmentIdsByPair.set(pairKey, shipmentIds);
  }
  for (const conversation of conversations) {
    const pairKey = `${conversation.shipperId}:${conversation.transporterId}`;
    if (!shipmentIdsByPair.has(pairKey)) shipmentIdsByPair.set(pairKey, new Set());
  }
  const lastMessageByConversationId = new Map();
  for (const message of messages) {
    if (!lastMessageByConversationId.has(message.conversationId)) lastMessageByConversationId.set(message.conversationId, message);
  }

  return conversations.map((conversation) => ({
    ...conversation,
    messages: lastMessageByConversationId.has(conversation.id)
      ? [lastMessageByConversationId.get(conversation.id)]
      : [],
    shipmentIds: [...new Set([
      ...(shipmentIdsByPair.get(`${conversation.shipperId}:${conversation.transporterId}`) || []),
    ])],
  }));
}

export function findConversation(id) {
  return prisma.conversation.findUnique({ where: { id }, select: conversationSelect });
}

export function findActiveTransporter(id) {
  return prisma.user.findFirst({ where: { id, role: 'TRANSPORTER', status: 'ACTIVE' }, select: { id: true } });
}

export function findActiveShipper(id) {
  return prisma.user.findFirst({ where: { id, role: 'SHIPPER', status: 'ACTIVE' }, select: { id: true } });
}

export function findOrCreateConversation(shipperId, transporterId) {
  return prisma.conversation.upsert({
    where: { shipperId_transporterId: { shipperId, transporterId } },
    create: { shipperId, transporterId },
    update: {},
    select: { id: true },
  });
}

export function findConversationBids(conversation) {
  return prisma.bid.findMany({
    where: {
      transporterId: conversation.transporterId,
      shipment: { shipperId: conversation.shipperId, removedAt: null },
    },
    select: {
      id: true,
      shipmentId: true,
      price: true,
      pickupDate: true,
      message: true,
      status: true,
      declineReason: true,
      createdAt: true,
      updatedAt: true,
      shipment: {
        select: {
          id: true,
          goodsDescription: true,
          goodsType: true,
          loadSize: true,
          weightKg: true,
          pickupLocation: true,
          deliveryLocation: true,
          pickupDate: true,
          status: true,
          shipper: {
            select: {
              id: true,
              name: true,
              image: true,
              phone: true,
              location: true,
              city: true,
            },
          },
        },
      },
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  });
}

export function findConversationMessages(conversationId) {
  return prisma.message.findMany({
    where: { conversationId },
    select: messageSelect,
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });
}

export function findConversationLastMessage(conversationId) {
  return prisma.message.findFirst({
    where: { conversationId },
    select: messageSelect,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  });
}

export function createMessage(conversationId, senderId, content) {
  return prisma.$transaction(async (transaction) => {
    const message = await transaction.message.create({
      data: { conversationId, senderId, content },
      select: messageSelect,
    });
    await transaction.conversation.update({ where: { id: conversationId }, data: { updatedAt: message.createdAt } });
    return message;
  });
}

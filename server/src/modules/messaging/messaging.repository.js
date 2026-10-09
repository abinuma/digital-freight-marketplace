import { prisma } from '../../shared/db/prisma.js';

const messageSelect = {
  id: true,
  shipmentId: true,
  senderId: true,
  content: true,
  createdAt: true,
};

export function findShipmentParticipant(shipmentId, userId) {
  return prisma.shipment.findUnique({
    where: { id: shipmentId },
    select: {
      id: true,
      shipperId: true,
      removedAt: true,
      bids: {
        where: { transporterId: userId, status: { in: ['PENDING', 'ACCEPTED'] } },
        select: { id: true },
        take: 1,
      },
    },
  });
}

export function findShipmentMessages(shipmentId) {
  return prisma.message.findMany({
    where: { shipmentId },
    select: messageSelect,
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });
}

export function createMessage(shipmentId, senderId, content) {
  return prisma.message.create({
    data: { shipmentId, senderId, content },
    select: messageSelect,
  });
}

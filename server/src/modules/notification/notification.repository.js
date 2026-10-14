import { prisma } from '../../shared/db/prisma.js';

const notificationSelect = {
  id: true,
  userId: true,
  type: true,
  title: true,
  message: true,
  read: true,
  referenceId: true,
  createdAt: true,
};

export function createNotification(data) {
  return prisma.notification.create({ data, select: notificationSelect });
}

export async function findNotifications(userId, { skip, take, unreadOnly }) {
  const where = { userId, ...(unreadOnly ? { read: false } : {}) };
  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      select: notificationSelect,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip,
      take,
    }),
    prisma.notification.count({ where }),
  ]);
  return { notifications, total };
}

export async function markNotificationRead(userId, id) {
  const updated = await prisma.notification.updateMany({ where: { id, userId }, data: { read: true } });
  if (updated.count === 0) return null;
  return prisma.notification.findFirst({ where: { id, userId }, select: notificationSelect });
}

export function markAllNotificationsRead(userId) {
  return prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
}

export function markNotificationsReadByReference(userId, referenceId) {
  return prisma.notification.updateMany({ where: { userId, referenceId, read: false }, data: { read: true } });
}

export function findBidNotificationDetails(bidId) {
  return prisma.bid.findUnique({
    where: { id: bidId },
    select: {
      id: true,
      price: true,
      transporter: { select: { id: true, name: true, email: true } },
      shipment: {
        select: {
          goodsDescription: true,
          pickupLocation: true,
          deliveryLocation: true,
          shipper: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });
}

export function findAcceptedTransporterForShipment(shipmentId) {
  return prisma.bid.findFirst({
    where: { shipmentId, status: 'ACCEPTED' },
    select: {
      transporter: { select: { id: true, name: true, email: true } },
      shipment: {
        select: {
          goodsDescription: true,
          pickupLocation: true,
          deliveryLocation: true,
        },
      },
    },
  });
}

export function findShipmentRemovalNotificationDetails(shipmentId, transporterIds) {
  return Promise.all([
    prisma.shipment.findUnique({
      where: { id: shipmentId },
      select: { goodsDescription: true, pickupLocation: true, deliveryLocation: true },
    }),
    prisma.user.findMany({
      where: { id: { in: transporterIds } },
      select: { id: true, name: true, email: true },
    }),
  ]).then(([shipment, transporters]) => shipment ? { shipment, transporters } : null);
}

export function findMessageNotificationDetails(conversationId) {
  return prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      shipper: { select: { id: true, name: true, email: true } },
      transporter: { select: { id: true, name: true, email: true } },
    },
  });
}


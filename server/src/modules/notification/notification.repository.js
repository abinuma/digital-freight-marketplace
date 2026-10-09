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

export async function findNotifications(userId, { skip, take }) {
  const where = { userId };
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

export function findMessageNotificationDetails(shipmentId, senderId) {
  return prisma.shipment
    .findUnique({
      where: { id: shipmentId },
      select: {
        shipperId: true,
        goodsDescription: true,
        pickupLocation: true,
        deliveryLocation: true,
        shipper: { select: { id: true, name: true, email: true } },
        bids: {
          where: { status: { in: ['PENDING', 'ACCEPTED'] } },
          select: {
            status: true,
            transporter: { select: { id: true, name: true, email: true } },
          },
        },
      },
    })
    .then(async (shipment) => {
      if (!shipment) return null;
      const sender = await prisma.user.findUnique({
        where: { id: senderId },
        select: { id: true, name: true },
      });
      return { shipment, sender };
    });
}

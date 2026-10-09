import { prisma } from '../../shared/db/prisma.js';

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
      transporter: { select: { name: true, email: true } },
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
      select: { name: true, email: true },
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
          where: { status: 'ACCEPTED' },
          select: {
            transporter: { select: { id: true, name: true, email: true } },
          },
          take: 1,
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

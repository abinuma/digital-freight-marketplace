import { prisma } from '../../shared/db/prisma.js';

const bidSelect = {
  id: true,
  shipmentId: true,
  transporterId: true,
  price: true,
  pickupDate: true,
  message: true,
  status: true,
  declineReason: true,
  createdAt: true,
  updatedAt: true,
};

export function findShipmentForBid(shipmentId) {
  return prisma.shipment.findUnique({
    where: { id: shipmentId },
    select: { id: true, shipperId: true, status: true },
  });
}

export function createBid(transporterId, shipmentId, data) {
  return prisma.bid.create({
    data: { ...data, transporterId, shipmentId },
    select: bidSelect,
  });
}

export function findBidById(id) {
  return prisma.bid.findUnique({ where: { id }, select: bidSelect });
}

export function findOwnedPendingBid(id, shipmentId, transporterId) {
  return prisma.bid.findFirst({
    where: { id, shipmentId, transporterId, status: 'PENDING' },
    select: bidSelect,
  });
}

export function updatePendingBid(id, shipmentId, transporterId, data) {
  return prisma.bid.updateMany({
    where: { id, shipmentId, transporterId, status: 'PENDING' },
    data,
  });
}

export function withdrawPendingBid(id, shipmentId, transporterId) {
  return prisma.bid.updateMany({
    where: { id, shipmentId, transporterId, status: 'PENDING' },
    data: { status: 'WITHDRAWN' },
  });
}

export async function findVisibleShipmentBids({ where, orderBy, skip, take }) {
  const [bids, total] = await Promise.all([
    prisma.bid.findMany({ where: { ...where, status: { not: 'WITHDRAWN' } }, select: bidSelect, orderBy, skip, take }),
    prisma.bid.count({ where: { ...where, status: { not: 'WITHDRAWN' } } }),
  ]);

  return { bids, total };
}

export async function findTransporterBids({ where, orderBy, skip, take }) {
  const [bids, total] = await Promise.all([
    prisma.bid.findMany({ where, select: bidSelect, orderBy, skip, take }),
    prisma.bid.count({ where }),
  ]);

  return { bids, total };
}

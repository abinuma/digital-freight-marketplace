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

export function declinePendingBid(id, shipmentId, declineReason) {
  return prisma.bid.updateMany({
    where: { id, shipmentId, status: 'PENDING' },
    data: { status: 'DECLINED', declineReason: declineReason ?? null },
  });
}

export async function acceptBidAndTransitionShipment({ id, shipmentId, shipperId }) {
  try {
    return await prisma.$transaction(async (transaction) => {
      const shipmentUpdate = await transaction.shipment.updateMany({
        where: { id: shipmentId, shipperId, status: 'PUBLISHED' },
        data: { status: 'IN_PROGRESS' },
      });
      if (shipmentUpdate.count !== 1) throw new Error('BID_ACCEPTANCE_CONFLICT');

      const bidUpdate = await transaction.bid.updateMany({
        where: { id, shipmentId, status: 'PENDING' },
        data: { status: 'ACCEPTED' },
      });
      if (bidUpdate.count !== 1) throw new Error('BID_ACCEPTANCE_CONFLICT');

      await transaction.bid.updateMany({
        where: { shipmentId, id: { not: id }, status: 'PENDING' },
        data: { status: 'DECLINED' },
      });

      return transaction.bid.findUnique({ where: { id }, select: bidSelect });
    });
  } catch (error) {
    if (error?.message === 'BID_ACCEPTANCE_CONFLICT') return null;
    throw error;
  }
}

export async function findVisibleShipmentBids({ where, status, orderBy, skip, take }) {
  const bidWhere = { ...where, status: status ?? { not: 'WITHDRAWN' } };
  const [bids, total] = await Promise.all([
    prisma.bid.findMany({ where: bidWhere, select: bidSelect, orderBy, skip, take }),
    prisma.bid.count({ where: bidWhere }),
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

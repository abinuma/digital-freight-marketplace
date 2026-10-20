import { prisma } from '../../shared/db/prisma.js';

const shipmentListSelect = {
  id: true,
  shipperId: true,
  goodsDescription: true,
  goodsType: true,
  loadSize: true,
  weightKg: true,
  pickupLocation: true,
  pickupLat: true,
  pickupLng: true,
  deliveryLocation: true,
  deliveryLat: true,
  deliveryLng: true,
  pickupDate: true,
  specialRequirements: true,
  status: true,
  removedAt: true,
  createdAt: true,
  updatedAt: true,
};

export function createShipment(shipperId, data) {
  return prisma.shipment.create({
    data: { ...data, shipperId },
    select: shipmentListSelect,
  });
}

export async function findShipments({ where, orderBy, skip, take, includeImages = false }) {
  const [shipments, total] = await Promise.all([
    prisma.shipment.findMany({
      where,
      select: {
        ...shipmentListSelect,
        ...(includeImages ? {
          images: {
            select: { id: true, url: true, order: true },
            orderBy: [{ order: 'asc' }, { id: 'asc' }],
          },
        } : {}),
      },
      orderBy,
      skip,
      take,
    }),
    prisma.shipment.count({ where }),
  ]);

  return { shipments, total };
}

export async function countActiveBidsByShipment(shipmentIds) {
  if (!shipmentIds.length) return {};
  const groups = await prisma.bid.groupBy({
    by: ['shipmentId'],
    where: { shipmentId: { in: shipmentIds }, status: { not: 'WITHDRAWN' } },
    _count: { _all: true },
  });
  return Object.fromEntries(groups.map(({ shipmentId, _count }) => [shipmentId, _count._all]));
}

export async function getShipperDashboardSummary(shipperId) {
  const where = { shipperId, removedAt: null };
  const [statusGroups, bidsReceived, messages, recentShipments, recentBids] = await Promise.all([
    prisma.shipment.groupBy({ by: ['status'], where, _count: { _all: true } }),
    prisma.bid.count({ where: { shipment: where, status: { not: 'WITHDRAWN' } } }),
    prisma.message.count({ where: { conversation: { shipperId } } }),
    prisma.shipment.findMany({
      where,
      select: shipmentListSelect,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      take: 5,
    }),
    prisma.bid.findMany({
      where: {
        shipment: where,
        status: { not: 'WITHDRAWN' },
      },
      select: {
        id: true,
        shipmentId: true,
        transporterId: true,
        price: true,
        pickupDate: true,
        message: true,
        status: true,
        createdAt: true,
        transporter: {
          select: {
            id: true,
            name: true,
            phone: true,
            city: true,
            vehicle: {
              select: {
                type: true,
                capacityTons: true,
              },
            },
          },
        },
        shipment: {
          select: {
            id: true,
            goodsDescription: true,
            goodsType: true,
            pickupLocation: true,
            deliveryLocation: true,
            status: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 5,
    }),
  ]);

  const recentBidGroups = recentShipments.length
    ? await prisma.bid.groupBy({
      by: ['shipmentId'],
      where: { shipmentId: { in: recentShipments.map(({ id }) => id) }, status: { not: 'WITHDRAWN' } },
      _count: { _all: true },
    })
    : [];

  return {
    statusCounts: statusGroups.map(({ status, _count }) => ({ status, count: _count._all })),
    bidsReceived,
    messages,
    recentShipments,
    recentBids,
    recentBidCounts: Object.fromEntries(recentBidGroups.map(({ shipmentId, _count }) => [shipmentId, _count._all])),
  };
}

export async function findAdminShipments({ status, orderBy, skip, take }) {
  const where = status ? { status } : {};
  const [shipments, total] = await Promise.all([
    prisma.shipment.findMany({
      where,
      select: {
        ...shipmentListSelect,
        moderationActions: {
          select: {
            id: true,
            reason: true,
            createdAt: true,
            admin: { select: { id: true, name: true, email: true } },
          },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        },
      },
      orderBy,
      skip,
      take,
    }),
    prisma.shipment.count({ where }),
  ]);
  return { shipments, total };
}

export async function getAdminShipmentMetrics() {
  const counts = await prisma.shipment.groupBy({ by: ['status'], _count: { _all: true } });
  const metrics = Object.fromEntries(['DRAFT', 'PUBLISHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((status) => [status, 0]));
  for (const { status, _count } of counts) metrics[status] = _count._all;
  return {
    active: metrics.PUBLISHED + metrics.IN_PROGRESS,
    completed: metrics.COMPLETED,
    cancelled: metrics.CANCELLED,
  };
}

export async function softRemoveShipmentWithAudit({ id, adminId, reason, removedAt }) {
  return prisma.$transaction(async (transaction) => {
    const update = await transaction.shipment.updateMany({
      where: { id, removedAt: null },
      data: { removedAt },
    });
    if (update.count === 0) return null;

    const pendingBids = await transaction.bid.findMany({
      where: { shipmentId: id, status: 'PENDING' },
      select: { id: true, transporterId: true },
    });
    await transaction.bid.updateMany({
      where: { shipmentId: id, status: 'PENDING' },
      data: { status: 'DECLINED' },
    });
    const moderation = await transaction.shipmentModeration.create({
      data: { shipmentId: id, adminId, reason, createdAt: removedAt },
      select: { id: true },
    });

    return {
      moderationId: moderation.id,
      pendingBidIds: pendingBids.map(({ id: bidId }) => bidId),
      transporterIds: [...new Set(pendingBids.map(({ transporterId }) => transporterId))],
    };
  }, { isolationLevel: 'Serializable' });
}

export function findShipmentById(id) {
  return prisma.shipment.findUnique({
    where: { id },
    select: {
      ...shipmentListSelect,
      images: { select: { id: true, url: true, order: true, createdAt: true }, orderBy: [{ order: 'asc' }, { id: 'asc' }] },
    },
  });
}

export function hasTransporterBid(shipmentId, transporterId) {
  return prisma.bid.findFirst({
    where: { shipmentId, transporterId, status: { in: ['PENDING', 'ACCEPTED'] } },
    select: { id: true },
  });
}

export function findShipmentForUpdate(id) {
  return prisma.shipment.findUnique({
    where: { id },
    select: {
      id: true,
      shipperId: true,
      status: true,
      removedAt: true,
      bids: { where: { status: { in: ['PENDING', 'ACCEPTED'] } }, select: { id: true }, take: 1 },
    },
  });
}

export function updateShipment(id, data) {
  return prisma.shipment.update({ where: { id }, data, select: shipmentListSelect });
}

export function transitionShipment(id, fromStatuses, status) {
  return prisma.shipment.updateMany({
    where: { id, status: { in: fromStatuses } },
    data: { status },
  });
}

export function cancelShipmentAndDeclinePendingBids(id) {
  return prisma.$transaction(async (transaction) => {
    const acceptedBid = await transaction.bid.findFirst({
      where: { shipmentId: id, status: 'ACCEPTED' },
      select: { id: true },
    });
    if (acceptedBid) return { blockedByAcceptedBid: true };

    const updated = await transaction.shipment.updateMany({
      where: { id, status: { in: ['DRAFT', 'PUBLISHED'] } },
      data: { status: 'CANCELLED' },
    });

    if (updated.count === 0) return { cancelled: false };

    await transaction.bid.updateMany({
      where: { shipmentId: id, status: 'PENDING' },
      data: { status: 'DECLINED' },
    });

    return { cancelled: true };
  });
}

export function findShipmentStatusById(id) {
  return prisma.shipment.findUnique({ where: { id }, select: { id: true, shipperId: true, status: true, removedAt: true } });
}

export function findShipmentAfterTransition(id) {
  return prisma.shipment.findUnique({ where: { id }, select: shipmentListSelect });
}

export function countShipmentImages(shipmentId) {
  return prisma.shipmentImage.count({ where: { shipmentId } });
}

export function createShipmentImages(shipmentId, uploadedImages) {
  return prisma.$transaction(async (transaction) => {
    const currentCount = await transaction.shipmentImage.count({ where: { shipmentId } });
    if (currentCount + uploadedImages.length > 1) return null;

    const lastImage = await transaction.shipmentImage.findFirst({
      where: { shipmentId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const firstOrder = (lastImage?.order ?? -1) + 1;

    const images = [];
    for (const [index, image] of uploadedImages.entries()) {
      images.push(await transaction.shipmentImage.create({
        data: { shipmentId, url: image.url, order: firstOrder + index },
        select: { id: true, shipmentId: true, url: true, order: true, createdAt: true },
      }));
    }
    return images;
  }, { isolationLevel: 'Serializable' });
}

export function findShipmentImage(shipmentId, imageId) {
  return prisma.shipmentImage.findFirst({
    where: { id: imageId, shipmentId },
    select: { id: true, url: true, order: true, createdAt: true },
  });
}

export function deleteShipmentImage(shipmentId, imageId) {
  return prisma.shipmentImage.deleteMany({ where: { id: imageId, shipmentId } });
}

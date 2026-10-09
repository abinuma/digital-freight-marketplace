import { prisma } from '../../shared/db/prisma.js';

const shipmentListSelect = {
  id: true,
  shipperId: true,
  goodsDescription: true,
  goodsType: true,
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

export async function findShipments({ where, orderBy, skip, take }) {
  const [shipments, total] = await Promise.all([
    prisma.shipment.findMany({
      where,
      select: shipmentListSelect,
      orderBy,
      skip,
      take,
    }),
    prisma.shipment.count({ where }),
  ]);

  return { shipments, total };
}

export function findAdminShipments({ status, orderBy, skip, take }) {
  const where = status ? { status } : {};
  return findShipments({ where, orderBy, skip, take });
}

export function softRemoveShipment(id, removedAt) {
  return prisma.shipment.updateMany({
    where: { id, removedAt: null },
    data: { removedAt },
  });
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

export function findShipmentForUpdate(id) {
  return prisma.shipment.findUnique({
    where: { id },
    select: {
      id: true,
      shipperId: true,
      status: true,
      removedAt: true,
      bids: { where: { status: 'ACCEPTED' }, select: { id: true }, take: 1 },
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
    const updated = await transaction.shipment.updateMany({
      where: { id, status: { not: 'COMPLETED' } },
      data: { status: 'CANCELLED' },
    });

    if (updated.count === 0) return false;

    await transaction.bid.updateMany({
      where: { shipmentId: id, status: 'PENDING' },
      data: { status: 'DECLINED' },
    });

    return true;
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
    if (currentCount + uploadedImages.length > 5) return null;

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

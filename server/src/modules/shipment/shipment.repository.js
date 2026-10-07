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
  createdAt: true,
  updatedAt: true,
};

export function createShipment(shipperId, data) {
  return prisma.shipment.create({
    data: { ...data, shipperId },
    select: shipmentListSelect,
  });
}

export async function findShipments({ where, skip, take }) {
  const [shipments, total] = await Promise.all([
    prisma.shipment.findMany({
      where,
      select: shipmentListSelect,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip,
      take,
    }),
    prisma.shipment.count({ where }),
  ]);

  return { shipments, total };
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

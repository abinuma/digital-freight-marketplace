import { AppError } from '../../shared/utils/AppError.js';
import { formatPagination, getPagination } from '../../shared/utils/pagination.js';
import * as shipmentRepository from './shipment.repository.js';

function toApiShipment(shipment) {
  return {
    ...shipment,
    weightKg: Number(shipment.weightKg),
    pickupLat: shipment.pickupLat === null ? null : Number(shipment.pickupLat),
    pickupLng: shipment.pickupLng === null ? null : Number(shipment.pickupLng),
    deliveryLat: shipment.deliveryLat === null ? null : Number(shipment.deliveryLat),
    deliveryLng: shipment.deliveryLng === null ? null : Number(shipment.deliveryLng),
  };
}

export async function createShipment(shipperId, input) {
  const data = {
    ...input,
    pickupDate: new Date(`${input.pickupDate}T00:00:00.000Z`),
  };
  const shipment = await shipmentRepository.createShipment(shipperId, data);
  return toApiShipment(shipment);
}

export async function listShipments(user, query) {
  const { page, limit, skip, take } = getPagination(query);
  const where = user.role === 'SHIPPER' ? { shipperId: user.id } : { status: 'PUBLISHED' };
  const { shipments, total } = await shipmentRepository.findShipments({ where, skip, take });

  return {
    shipments: shipments.map(toApiShipment),
    pagination: formatPagination({ page, limit, total }),
  };
}

export async function getShipment(user, id) {
  const shipment = await shipmentRepository.findShipmentById(id);
  if (!shipment) throw new AppError('Shipment was not found', 404);

  const canView = shipment.shipperId === user.id || shipment.status === 'PUBLISHED' || user.role === 'ADMIN';
  if (!canView) throw new AppError('You are not authorized to view this shipment', 403);

  return toApiShipment(shipment);
}

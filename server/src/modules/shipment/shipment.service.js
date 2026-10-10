import { AppError } from '../../shared/utils/AppError.js';
import { formatPagination, getPagination } from '../../shared/utils/pagination.js';
import * as shipmentRepository from './shipment.repository.js';
import * as shipmentStorage from './shipment.storage.js';
import * as notificationService from '../notification/notification.service.js';

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
  const filters = [];

  if (query.pickupLocation) filters.push({ pickupLocation: { contains: query.pickupLocation, mode: 'insensitive' } });
  if (query.deliveryLocation) filters.push({ deliveryLocation: { contains: query.deliveryLocation, mode: 'insensitive' } });
  if (query.goodsType) filters.push({ goodsType: { equals: query.goodsType, mode: 'insensitive' } });
  if (query.status && user.role === 'SHIPPER') filters.push({ status: query.status });

  if (query.pickupDateFrom || query.pickupDateTo) {
    filters.push({
      pickupDate: {
        ...(query.pickupDateFrom ? { gte: new Date(`${query.pickupDateFrom}T00:00:00.000Z`) } : {}),
        ...(query.pickupDateTo ? { lte: new Date(`${query.pickupDateTo}T00:00:00.000Z`) } : {}),
      },
    });
  }

  if (query.q) {
    filters.push({
      OR: [
        { goodsDescription: { contains: query.q, mode: 'insensitive' } },
        { specialRequirements: { contains: query.q, mode: 'insensitive' } },
      ],
    });
  }

  const visibility = user.role === 'SHIPPER'
    ? { shipperId: user.id, removedAt: null }
    : { status: 'PUBLISHED', removedAt: null };
  const where = filters.length > 0 ? { AND: [visibility, ...filters] } : visibility;
  const sortField = query.sortBy === 'pickupDate' ? 'pickupDate' : 'createdAt';
  const sortDirection = sortField === 'pickupDate' ? 'asc' : 'desc';
  const orderBy = [{ [sortField]: sortDirection }, { id: 'asc' }];
  const { shipments, total } = await shipmentRepository.findShipments({ where, orderBy, skip, take });

  return {
    shipments: shipments.map(toApiShipment),
    pagination: formatPagination({ page, limit, total }),
  };
}

export async function getShipperDashboardSummary(user) {
  if (user.role !== 'SHIPPER') throw new AppError('Only Shippers can view the shipper dashboard', 403);
  const summary = await shipmentRepository.getShipperDashboardSummary(user.id);
  const counts = { DRAFT: 0, PUBLISHED: 0, IN_PROGRESS: 0, COMPLETED: 0, CANCELLED: 0 };
  for (const { status, count } of summary.statusCounts) counts[status] = count;

  return {
    counts: {
      drafts: counts.DRAFT,
      activePostings: counts.PUBLISHED,
      inTransit: counts.IN_PROGRESS,
      completed: counts.COMPLETED,
      cancelled: counts.CANCELLED,
      bidsReceived: summary.bidsReceived,
      messages: summary.messages,
    },
    recentShipments: summary.recentShipments.map((shipment) => ({
      ...toApiShipment(shipment),
      bidCount: summary.recentBidCounts[shipment.id] || 0,
    })),
  };
}

export async function listAdminShipments(user, query = {}) {
  if (user.role !== 'ADMIN') throw new AppError('You are not authorized to access this resource', 403);

  const { page, limit, skip, take } = getPagination(query);
  const orderBy = [{ createdAt: 'desc' }, { id: 'asc' }];
  const { shipments, total } = await shipmentRepository.findAdminShipments({
    status: query.status,
    orderBy,
    skip,
    take,
  });

  return { shipments: shipments.map(toApiShipment), pagination: formatPagination({ page, limit, total }) };
}

export function getAdminShipmentMetrics() {
  return shipmentRepository.getAdminShipmentMetrics();
}

export async function softRemoveShipment(user, id, reason) {
  if (user.role !== 'ADMIN') throw new AppError('You are not authorized to access this resource', 403);

  const removedAt = new Date();
  let result;
  try {
    result = await shipmentRepository.softRemoveShipmentWithAudit({ id, adminId: user.id, reason, removedAt });
  } catch (error) {
    if (error?.code === 'P2034') {
      throw new AppError('Shipment or bids changed during moderation. Please retry.', 409);
    }
    throw error;
  }
  if (!result) {
    const shipment = await shipmentRepository.findShipmentById(id);
    if (!shipment) throw new AppError('Shipment was not found', 404);
    throw new AppError('Shipment has already been removed', 409);
  }

  await notificationService.shipmentRemoved(id, result.transporterIds);
  return {
    id,
    moderationId: result.moderationId,
    removedAt,
    removed: true,
    declinedBids: result.pendingBidIds.length,
  };
}

export async function getShipment(user, id) {
  const shipment = await shipmentRepository.findShipmentById(id);
  if (!shipment || (shipment.removedAt && user.role !== 'ADMIN')) throw new AppError('Shipment was not found', 404);

  const canView = shipment.shipperId === user.id || shipment.status === 'PUBLISHED' || user.role === 'ADMIN';
  if (!canView) throw new AppError('You are not authorized to view this shipment', 403);

  return toApiShipment(shipment);
}

export async function updateShipment(user, id, input) {
  const shipment = await shipmentRepository.findShipmentForUpdate(id);
  if (!shipment) throw new AppError('Shipment was not found', 404);
  if (shipment.removedAt) throw new AppError('Shipment was not found', 404);
  if (shipment.shipperId !== user.id) throw new AppError('You can only update your own shipments', 403);

  const canEdit = shipment.status === 'DRAFT' || (shipment.status === 'PUBLISHED' && shipment.bids.length === 0);
  if (!canEdit) throw new AppError('Shipment cannot be edited in its current state', 409);

  const data = { ...input };
  if (data.pickupDate !== undefined) data.pickupDate = new Date(`${data.pickupDate}T00:00:00.000Z`);

  return toApiShipment(await shipmentRepository.updateShipment(id, data));
}

async function getOwnedShipment(user, id) {
  const shipment = await shipmentRepository.findShipmentStatusById(id);
  if (!shipment) throw new AppError('Shipment was not found', 404);
  if (shipment.removedAt) throw new AppError('Shipment was not found', 404);
  if (shipment.shipperId !== user.id) throw new AppError('You can only manage your own shipments', 403);
  return shipment;
}

async function applyTransition(user, id, allowedFrom, targetStatus) {
  const shipment = await getOwnedShipment(user, id);
  if (!allowedFrom.includes(shipment.status)) {
    throw new AppError(`Shipment cannot transition from ${shipment.status} to ${targetStatus}`, 422);
  }

  const updated = await shipmentRepository.transitionShipment(id, allowedFrom, targetStatus);
  if (updated.count === 0) {
    throw new AppError('Shipment status changed before the requested action could be applied', 409);
  }

  if (targetStatus === 'COMPLETED') await notificationService.shipmentCompleted(id);
  return toApiShipment(await shipmentRepository.findShipmentAfterTransition(id));
}

export function publishShipment(user, id) {
  return applyTransition(user, id, ['DRAFT'], 'PUBLISHED');
}

export async function cancelShipment(user, id) {
  const shipment = await getOwnedShipment(user, id);
  if (shipment.status === 'COMPLETED') {
    throw new AppError('Completed shipments cannot be cancelled', 422);
  }

  const cancelled = await shipmentRepository.cancelShipmentAndDeclinePendingBids(id);
  if (!cancelled) {
    throw new AppError('Shipment status changed before the requested action could be applied', 409);
  }

  return toApiShipment(await shipmentRepository.findShipmentAfterTransition(id));
}

export function completeShipment(user, id) {
  return applyTransition(user, id, ['IN_PROGRESS'], 'COMPLETED');
}

export async function uploadShipmentImages(user, id, files) {
  await getOwnedShipment(user, id);
  const currentCount = await shipmentRepository.countShipmentImages(id);
  if (currentCount + files.length > 5) {
    throw new AppError('A shipment may have no more than 5 images', 409);
  }

  const uploadedImages = [];
  try {
    for (const file of files) {
      uploadedImages.push(await shipmentStorage.uploadShipmentImage(file.buffer, id));
    }

    const savedImages = await shipmentRepository.createShipmentImages(id, uploadedImages);
    if (!savedImages) {
      throw new AppError('A shipment may have no more than 5 images', 409);
    }
    return savedImages;
  } catch (error) {
    await shipmentStorage.deleteUploadedImages(uploadedImages);
    if (error?.code === 'P2034') {
      throw new AppError('Shipment images changed during upload. Please retry.', 409);
    }
    throw error;
  }
}

export async function removeShipmentImage(user, shipmentId, imageId) {
  await getOwnedShipment(user, shipmentId);
  const image = await shipmentRepository.findShipmentImage(shipmentId, imageId);
  if (!image) throw new AppError('Shipment image was not found', 404);

  await shipmentStorage.deleteShipmentImage(image.url);
  const result = await shipmentRepository.deleteShipmentImage(shipmentId, imageId);
  if (result.count === 0) throw new AppError('Shipment image was not found', 404);

  return { id: image.id, shipmentId, deleted: true };
}

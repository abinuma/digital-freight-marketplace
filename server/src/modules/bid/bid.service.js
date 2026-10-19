import { AppError } from '../../shared/utils/AppError.js';
import { formatPagination, getPagination } from '../../shared/utils/pagination.js';
import * as bidRepository from './bid.repository.js';
import * as notificationService from '../notification/notification.service.js';

function toApiBid(bid, { includeShipment = false } = {}) {
  const apiBid = { ...bid };
  if (!includeShipment) delete apiBid.shipment;
  return { ...apiBid, price: Number(apiBid.price) };
}

function toApiBids(bids) {
  return bids.map(toApiBid);
}

function isActiveBidConflict(error) {
  return error?.code === 'P2002' && (
    error?.meta?.target?.includes?.('idx_bid_shipment_transporter') ||
    (Array.isArray(error?.meta?.target) &&
      error.meta.target.includes('shipmentId') &&
      error.meta.target.includes('transporterId'))
  );
}

async function getPendingOwnedBid(id, shipmentId, transporterId) {
  const bid = await bidRepository.findBidById(id);
  if (!bid) throw new AppError('Bid was not found', 404);
  if (bid.shipment?.removedAt) throw new AppError('Shipment was not found', 404);
  if (bid.shipmentId !== shipmentId) throw new AppError('Bid was not found', 404);
  if (bid.transporterId !== transporterId) throw new AppError('You can only manage your own bids', 403);
  if (bid.status !== 'PENDING') throw new AppError('Only pending bids can be updated or withdrawn', 422);
  return bid;
}

export async function createBid(user, shipmentId, input) {
  if (user.role !== 'TRANSPORTER') throw new AppError('Only Transporters can submit bids', 403);

  const shipment = await bidRepository.findShipmentForBid(shipmentId);
  if (!shipment) throw new AppError('Shipment was not found', 404);
  if (shipment.removedAt) throw new AppError('Shipment was not found', 404);
  if (shipment.status !== 'PUBLISHED') {
    throw new AppError('Bids can only be submitted on published shipments', 422);
  }

  const inviteMatch = shipment.specialRequirements?.match(/\[INVITED_DRIVER:([^\]]+)\]/);
  const invitedDriverId = inviteMatch ? inviteMatch[1] : null;
  if (invitedDriverId && invitedDriverId !== user.id) {
    throw new AppError('This shipment is an exclusive load invitation for another transporter', 403);
  }

  try {
    const bid = await bidRepository.createBid(user.id, shipmentId, shipment.shipperId, {
      ...input,
      pickupDate: new Date(input.pickupDate),
    });
    await notificationService.bidReceived(bid.id);
    return toApiBid(bid);
  } catch (error) {
    if (isActiveBidConflict(error)) {
      throw new AppError('You already have an active bid on this shipment', 409);
    }
    throw error;
  }
}

export async function updateBid(user, shipmentId, id, input) {
  const existingBid = await getPendingOwnedBid(id, shipmentId, user.id);
  const data = { ...input };
  if (data.pickupDate !== undefined) data.pickupDate = new Date(data.pickupDate);

  const result = await bidRepository.updatePendingBid(id, shipmentId, user.id, data);
  if (result.count !== 1) throw new AppError('Bid status changed before the requested update could be applied', 409);

  return toApiBid(await bidRepository.findBidById(existingBid.id));
}

export async function withdrawBid(user, shipmentId, id) {
  await getPendingOwnedBid(id, shipmentId, user.id);
  const result = await bidRepository.withdrawPendingBid(id, shipmentId, user.id);
  if (result.count !== 1) throw new AppError('Bid status changed before it could be withdrawn', 409);

  return toApiBid(await bidRepository.findBidById(id));
}

export async function listShipmentBids(user, shipmentId, query = {}) {
  const shipment = await bidRepository.findShipmentForBid(shipmentId);
  if (!shipment) throw new AppError('Shipment was not found', 404);
  if (user.role !== 'ADMIN' && shipment.shipperId !== user.id) {
    throw new AppError('You can only view bids on your own shipments', 403);
  }

  const { page, limit, skip, take } = getPagination(query);
  const orderBy = [{ createdAt: 'desc' }, { id: 'asc' }];
  const { bids, total } = await bidRepository.findVisibleShipmentBids({
    where: { shipmentId }, status: query.status, orderBy, skip, take,
  });

  return { bids: toApiBids(bids), pagination: formatPagination({ page, limit, total }) };
}

export async function listMyBids(user, query = {}) {
  if (user.role !== 'TRANSPORTER') throw new AppError('Only Transporters can view their bids', 403);

  const { page, limit, skip, take } = getPagination(query);
  const where = {
    transporterId: user.id,
    ...(query.status ? { status: query.status } : {}),
    ...(query.shipmentId ? { shipmentId: query.shipmentId } : {}),
  };
  const orderBy = [{ createdAt: 'desc' }, { id: 'asc' }];
  const { bids, total } = await bidRepository.findTransporterBids({ where, orderBy, skip, take });

  return {
    bids: bids.map((bid) => toApiBid(bid, { includeShipment: true })),
    pagination: formatPagination({ page, limit, total }),
  };
}

export async function getBid(user, shipmentId, id) {
  const bid = await bidRepository.findBidById(id);
  if (!bid) throw new AppError('Bid was not found', 404);
  if (bid.shipmentId !== shipmentId) throw new AppError('Bid was not found', 404);
  const shipment = await bidRepository.findShipmentForBid(bid.shipmentId);
  if (shipment?.removedAt) throw new AppError('Shipment was not found', 404);
  const isShipperOwner = shipment?.shipperId === user.id;
  const isTransporterOwner = bid.transporterId === user.id;
  if (!isShipperOwner && !isTransporterOwner && user.role !== 'ADMIN') {
    throw new AppError('You are not authorized to view this bid', 403);
  }
  return toApiBid(bid);
}

async function getShipperOwnedPendingBid(user, shipmentId, id) {
  const shipment = await bidRepository.findShipmentForBid(shipmentId);
  if (!shipment) throw new AppError('Shipment was not found', 404);
  if (shipment.removedAt) throw new AppError('Shipment was not found', 404);
  if (shipment.shipperId !== user.id) throw new AppError('You can only manage bids on your own shipments', 403);

  const bid = await bidRepository.findBidById(id);
  if (!bid || bid.shipmentId !== shipmentId) throw new AppError('Bid was not found', 404);
  if (bid.status !== 'PENDING') throw new AppError('Only pending bids can be accepted or declined', 422);
  return { bid, shipment };
}

export async function acceptBid(user, shipmentId, id) {
  if (user.role !== 'SHIPPER') throw new AppError('Only Shippers can accept bids', 403);
  const { shipment } = await getShipperOwnedPendingBid(user, shipmentId, id);
  if (shipment.status !== 'PUBLISHED') {
    throw new AppError('Bids can only be accepted on published shipments', 422);
  }

  const acceptTransaction = bidRepository.acceptBidAndTransitionShipmentWithEvents
    ? (input) => bidRepository.acceptBidAndTransitionShipmentWithEvents(input)
    : async (input) => {
      const acceptedBid = await bidRepository.acceptBidAndTransitionShipment(input);
      return acceptedBid ? { acceptedBid, declinedBidIds: [] } : null;
    };
  const result = await acceptTransaction({
    id,
    shipmentId,
    shipperId: user.id,
  });
  if (!result?.acceptedBid) {
    throw new AppError('Shipment or bid status changed before acceptance could be applied', 409);
  }

  const { acceptedBid, declinedBidIds } = result;
  await Promise.all([
    notificationService.bidStatusChanged(acceptedBid.id, 'BID_ACCEPTED'),
    ...declinedBidIds.map((declinedBidId) => notificationService.bidStatusChanged(declinedBidId, 'BID_DECLINED')),
  ]);
  return toApiBid(acceptedBid);
}

export async function declineBid(user, shipmentId, id, input = {}) {
  if (user.role !== 'SHIPPER') throw new AppError('Only Shippers can decline bids', 403);
  await getShipperOwnedPendingBid(user, shipmentId, id);

  const result = await bidRepository.declinePendingBid(id, shipmentId, input.declineReason);
  if (result.count !== 1) throw new AppError('Bid status changed before decline could be applied', 409);

  await notificationService.bidStatusChanged(id, 'BID_DECLINED');
  return toApiBid(await bidRepository.findBidById(id));
}

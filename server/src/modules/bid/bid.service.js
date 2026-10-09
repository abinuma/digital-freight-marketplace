import { AppError } from '../../shared/utils/AppError.js';
import { formatPagination, getPagination } from '../../shared/utils/pagination.js';
import * as bidRepository from './bid.repository.js';

function toApiBid(bid) {
  return { ...bid, price: Number(bid.price) };
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

async function getPendingOwnedBid(id, transporterId) {
  const bid = await bidRepository.findBidById(id);
  if (!bid) throw new AppError('Bid was not found', 404);
  if (bid.transporterId !== transporterId) throw new AppError('You can only manage your own bids', 403);
  if (bid.status !== 'PENDING') throw new AppError('Only pending bids can be updated or withdrawn', 422);
  return bid;
}

export async function createBid(user, shipmentId, input) {
  if (user.role !== 'TRANSPORTER') throw new AppError('Only Transporters can submit bids', 403);

  const shipment = await bidRepository.findShipmentForBid(shipmentId);
  if (!shipment) throw new AppError('Shipment was not found', 404);
  if (shipment.status !== 'PUBLISHED') {
    throw new AppError('Bids can only be submitted on published shipments', 422);
  }

  try {
    const bid = await bidRepository.createBid(user.id, shipmentId, {
      ...input,
      pickupDate: new Date(input.pickupDate),
    });
    return toApiBid(bid);
  } catch (error) {
    if (isActiveBidConflict(error)) {
      throw new AppError('You already have an active bid on this shipment', 409);
    }
    throw error;
  }
}

export async function updateBid(user, id, input) {
  const existingBid = await getPendingOwnedBid(id, user.id);
  const data = { ...input };
  if (data.pickupDate !== undefined) data.pickupDate = new Date(data.pickupDate);

  const result = await bidRepository.updatePendingBid(id, user.id, data);
  if (result.count !== 1) throw new AppError('Bid status changed before the requested update could be applied', 409);

  return toApiBid(await bidRepository.findBidById(existingBid.id));
}

export async function withdrawBid(user, id) {
  await getPendingOwnedBid(id, user.id);
  const result = await bidRepository.withdrawPendingBid(id, user.id);
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
  const { bids, total } = await bidRepository.findPendingBids({
    where: { shipmentId }, orderBy, skip, take,
  });

  return { bids: toApiBids(bids), pagination: formatPagination({ page, limit, total }) };
}

export async function listMyBids(user, query = {}) {
  if (user.role !== 'TRANSPORTER') throw new AppError('Only Transporters can view their bids', 403);

  const { page, limit, skip, take } = getPagination(query);
  const where = { transporterId: user.id };
  const orderBy = [{ createdAt: 'desc' }, { id: 'asc' }];
  const { bids, total } = await bidRepository.findTransporterBids({ where, orderBy, skip, take });

  return { bids: toApiBids(bids), pagination: formatPagination({ page, limit, total }) };
}

export async function getBid(user, id) {
  const bid = await bidRepository.findBidById(id);
  if (!bid) throw new AppError('Bid was not found', 404);
  const shipment = await bidRepository.findShipmentForBid(bid.shipmentId);
  const isShipperOwner = shipment?.shipperId === user.id;
  const isTransporterOwner = bid.transporterId === user.id;
  if (!isShipperOwner && !isTransporterOwner && user.role !== 'ADMIN') {
    throw new AppError('You are not authorized to view this bid', 403);
  }
  return toApiBid(bid);
}

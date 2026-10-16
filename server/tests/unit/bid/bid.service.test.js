import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/modules/bid/bid.repository.js', () => ({
  findShipmentForBid: vi.fn(),
  createBid: vi.fn(),
  findBidById: vi.fn(),
  updatePendingBid: vi.fn(),
  withdrawPendingBid: vi.fn(),
  findVisibleShipmentBids: vi.fn(),
  findTransporterBids: vi.fn(),
  acceptBidAndTransitionShipment: vi.fn(),
  acceptBidAndTransitionShipmentWithEvents: vi.fn(),
  declinePendingBid: vi.fn(),
}));

vi.mock('../../../src/modules/notification/notification.service.js', () => ({
  bidReceived: vi.fn(),
  bidStatusChanged: vi.fn(),
}));

import * as bidRepository from '../../../src/modules/bid/bid.repository.js';
import * as bidService from '../../../src/modules/bid/bid.service.js';

const shipper = { id: 'shipper-id', role: 'SHIPPER' };
const transporter = { id: 'transporter-id', role: 'TRANSPORTER' };
const shipmentId = 'shipment-id';
const bidId = 'bid-id';
const pendingBid = {
  id: bidId,
  shipmentId,
  transporterId: transporter.id,
  price: '1200.50',
  pickupDate: new Date('2027-01-10T10:00:00.000Z'),
  message: null,
  status: 'PENDING',
  declineReason: null,
};

beforeEach(() => vi.clearAllMocks());

describe('bid service business rules', () => {
  it('creates a bid for a transporter on a published shipment', async () => {
    bidRepository.findShipmentForBid.mockResolvedValue({ id: shipmentId, status: 'PUBLISHED', shipperId: 'shipper-id' });
    bidRepository.createBid.mockResolvedValue(pendingBid);

    const result = await bidService.createBid(transporter, shipmentId, {
      price: 1200.5,
      pickupDate: '2027-01-10T10:00:00.000Z',
      message: 'Available for pickup',
    });

    expect(bidRepository.createBid).toHaveBeenCalledWith(transporter.id, shipmentId, 'shipper-id', {
      price: 1200.5,
      pickupDate: new Date('2027-01-10T10:00:00.000Z'),
      message: 'Available for pickup',
    });
    expect(result.price).toBe(1200.5);
  });

  it('rejects bids on shipments that are not published', async () => {
    bidRepository.findShipmentForBid.mockResolvedValue({ id: shipmentId, status: 'DRAFT' });

    await expect(bidService.createBid(transporter, shipmentId, { price: 10 })).rejects.toMatchObject({ statusCode: 422 });
    expect(bidRepository.createBid).not.toHaveBeenCalled();
  });

  it('rejects bids from a transporter who was not the invited driver', async () => {
    bidRepository.findShipmentForBid.mockResolvedValue({
      id: shipmentId,
      status: 'PUBLISHED',
      shipperId: 'shipper-id',
      specialRequirements: '[INVITED_DRIVER:some-other-driver] fragile goods',
    });

    await expect(bidService.createBid(transporter, shipmentId, { price: 10 })).rejects.toMatchObject({
      statusCode: 403,
      message: 'This shipment is an exclusive load invitation for another transporter',
    });
    expect(bidRepository.createBid).not.toHaveBeenCalled();
  });

  it('allows bids from the invited driver on an invite-only shipment', async () => {
    bidRepository.findShipmentForBid.mockResolvedValue({
      id: shipmentId,
      status: 'PUBLISHED',
      shipperId: 'shipper-id',
      specialRequirements: `[INVITED_DRIVER:${transporter.id}] fragile goods`,
    });
    bidRepository.createBid.mockResolvedValue(pendingBid);

    const result = await bidService.createBid(transporter, shipmentId, {
      price: 1200.5,
      pickupDate: '2027-01-10T10:00:00.000Z',
    });

    expect(bidRepository.createBid).toHaveBeenCalled();
    expect(result.id).toBe(bidId);
  });

  it('maps the active-bid unique constraint to a conflict response', async () => {
    bidRepository.findShipmentForBid.mockResolvedValue({ id: shipmentId, status: 'PUBLISHED' });
    bidRepository.createBid.mockRejectedValue({ code: 'P2002', meta: { target: ['shipmentId', 'transporterId'] } });

    await expect(bidService.createBid(transporter, shipmentId, { price: 10 })).rejects.toMatchObject({ statusCode: 409 });
  });

  it('rejects updates when the bid belongs to another transporter', async () => {
    bidRepository.findBidById.mockResolvedValue({ ...pendingBid, transporterId: 'another-transporter' });

    await expect(bidService.updateBid(transporter, shipmentId, bidId, { price: 20 })).rejects.toMatchObject({ statusCode: 403 });
    expect(bidRepository.updatePendingBid).not.toHaveBeenCalled();
  });

  it('rejects updates and withdrawals after a bid leaves PENDING', async () => {
    bidRepository.findBidById.mockResolvedValue({ ...pendingBid, status: 'ACCEPTED' });

    await expect(bidService.updateBid(transporter, shipmentId, bidId, { price: 20 })).rejects.toMatchObject({ statusCode: 422 });
    await expect(bidService.withdrawBid(transporter, shipmentId, bidId)).rejects.toMatchObject({ statusCode: 422 });
    expect(bidRepository.updatePendingBid).not.toHaveBeenCalled();
    expect(bidRepository.withdrawPendingBid).not.toHaveBeenCalled();
  });

  it('accepts a pending bid only for the owning shipper and published shipment', async () => {
    bidRepository.findShipmentForBid.mockResolvedValue({ id: shipmentId, shipperId: shipper.id, status: 'PUBLISHED' });
    bidRepository.findBidById.mockResolvedValue(pendingBid);
    bidRepository.acceptBidAndTransitionShipmentWithEvents.mockResolvedValue({
      acceptedBid: { ...pendingBid, status: 'ACCEPTED' },
      declinedBidIds: [],
    });

    const result = await bidService.acceptBid(shipper, shipmentId, bidId);

    expect(bidRepository.acceptBidAndTransitionShipmentWithEvents).toHaveBeenCalledWith({ id: bidId, shipmentId, shipperId: shipper.id });
    expect(result.status).toBe('ACCEPTED');
  });

  it('does not accept a bid when shipment ownership does not match', async () => {
    bidRepository.findShipmentForBid.mockResolvedValue({ id: shipmentId, shipperId: 'another-shipper', status: 'PUBLISHED' });

    await expect(bidService.acceptBid(shipper, shipmentId, bidId)).rejects.toMatchObject({ statusCode: 403 });
    expect(bidRepository.acceptBidAndTransitionShipment).not.toHaveBeenCalled();
  });

  it('stores the optional decline reason for the owning shipper', async () => {
    bidRepository.findShipmentForBid.mockResolvedValue({ id: shipmentId, shipperId: shipper.id, status: 'PUBLISHED' });
    bidRepository.findBidById.mockResolvedValue(pendingBid);
    bidRepository.declinePendingBid.mockResolvedValue({ count: 1 });
    bidRepository.findBidById.mockResolvedValueOnce(pendingBid).mockResolvedValueOnce({ ...pendingBid, status: 'DECLINED', declineReason: 'Capacity unavailable' });

    const result = await bidService.declineBid(shipper, shipmentId, bidId, { declineReason: 'Capacity unavailable' });

    expect(bidRepository.declinePendingBid).toHaveBeenCalledWith(bidId, shipmentId, 'Capacity unavailable');
    expect(result.declineReason).toBe('Capacity unavailable');
  });
});

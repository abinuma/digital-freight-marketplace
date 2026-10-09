import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prisma } = vi.hoisted(() => ({ prisma: { $transaction: vi.fn() } }));

vi.mock('../../../src/shared/db/prisma.js', () => ({ prisma }));

import { acceptBidAndTransitionShipment } from '../../../src/modules/bid/bid.repository.js';

const acceptedBid = { id: 'bid-id', shipmentId: 'shipment-id', status: 'ACCEPTED' };

beforeEach(() => vi.clearAllMocks());

describe('bid acceptance repository transaction', () => {
  it('accepts one bid, declines the other pending bids, and transitions the shipment atomically', async () => {
    const shipment = { updateMany: vi.fn().mockResolvedValue({ count: 1 }) };
    const bid = {
      updateMany: vi.fn().mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 2 }),
      findUnique: vi.fn().mockResolvedValue(acceptedBid),
    };
    prisma.$transaction.mockImplementation((callback) => callback({ shipment, bid }));

    const result = await acceptBidAndTransitionShipment({ id: 'bid-id', shipmentId: 'shipment-id', shipperId: 'shipper-id' });

    expect(result).toEqual(acceptedBid);
    expect(shipment.updateMany).toHaveBeenCalledWith({
      where: { id: 'shipment-id', shipperId: 'shipper-id', status: 'PUBLISHED' },
      data: { status: 'IN_PROGRESS' },
    });
    expect(bid.updateMany).toHaveBeenNthCalledWith(1, {
      where: { id: 'bid-id', shipmentId: 'shipment-id', status: 'PENDING' },
      data: { status: 'ACCEPTED' },
    });
    expect(bid.updateMany).toHaveBeenNthCalledWith(2, {
      where: { shipmentId: 'shipment-id', id: { not: 'bid-id' }, status: 'PENDING' },
      data: { status: 'DECLINED' },
    });
    expect(prisma.$transaction).toHaveBeenCalledOnce();
  });

  it('rolls back and reports a conflict if the selected bid is no longer pending', async () => {
    const shipment = { updateMany: vi.fn().mockResolvedValue({ count: 1 }) };
    const bid = { updateMany: vi.fn().mockResolvedValue({ count: 0 }) };
    prisma.$transaction.mockImplementation(async (callback) => callback({ shipment, bid }));

    const result = await acceptBidAndTransitionShipment({ id: 'bid-id', shipmentId: 'shipment-id', shipperId: 'shipper-id' });

    expect(result).toBeNull();
    expect(bid.updateMany).toHaveBeenCalledOnce();
  });

  it('does not update bids if the shipment is no longer published', async () => {
    const shipment = { updateMany: vi.fn().mockResolvedValue({ count: 0 }) };
    const bid = { updateMany: vi.fn() };
    prisma.$transaction.mockImplementation(async (callback) => callback({ shipment, bid }));

    const result = await acceptBidAndTransitionShipment({ id: 'bid-id', shipmentId: 'shipment-id', shipperId: 'shipper-id' });

    expect(result).toBeNull();
    expect(bid.updateMany).not.toHaveBeenCalled();
  });
});

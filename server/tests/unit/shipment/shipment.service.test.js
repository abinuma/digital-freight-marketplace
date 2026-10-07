import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/modules/shipment/shipment.repository.js', () => ({
  createShipment: vi.fn(),
  findShipments: vi.fn(),
  findShipmentById: vi.fn(),
  findShipmentForUpdate: vi.fn(),
  updateShipment: vi.fn(),
}));

import * as shipmentRepository from '../../../src/modules/shipment/shipment.repository.js';
import * as shipmentService from '../../../src/modules/shipment/shipment.service.js';

const draft = {
  id: '0ecb5efc-f011-4fc9-92a8-96df1682e579',
  shipperId: 'f92b3d47-f7da-4a12-b2db-35d902438f23',
  status: 'DRAFT',
  bids: [],
};

beforeEach(() => vi.clearAllMocks());

describe('shipment update service', () => {
  it('updates a draft owned by the requesting shipper', async () => {
    shipmentRepository.findShipmentForUpdate.mockResolvedValue(draft);
    shipmentRepository.updateShipment.mockResolvedValue({
      ...draft,
      goodsDescription: 'Household furniture shipment',
      weightKg: '125.50',
      pickupLat: null,
      pickupLng: null,
      deliveryLat: null,
      deliveryLng: null,
    });

    const result = await shipmentService.updateShipment(
      { id: draft.shipperId, role: 'SHIPPER' },
      draft.id,
      { goodsDescription: 'Household furniture shipment' },
    );

    expect(shipmentRepository.updateShipment).toHaveBeenCalledWith(draft.id, {
      goodsDescription: 'Household furniture shipment',
    });
    expect(result.weightKg).toBe(125.5);
  });

  it('rejects updates from a non-owner', async () => {
    shipmentRepository.findShipmentForUpdate.mockResolvedValue(draft);

    await expect(
      shipmentService.updateShipment({ id: 'another-user', role: 'SHIPPER' }, draft.id, { goodsType: 'Furniture' }),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(shipmentRepository.updateShipment).not.toHaveBeenCalled();
  });

  it('allows published shipment updates when no bid is accepted', async () => {
    shipmentRepository.findShipmentForUpdate.mockResolvedValue({ ...draft, status: 'PUBLISHED' });
    shipmentRepository.updateShipment.mockResolvedValue({
      ...draft,
      status: 'PUBLISHED',
      pickupDate: new Date('2026-10-10T00:00:00.000Z'),
      weightKg: '125.50',
      pickupLat: null,
      pickupLng: null,
      deliveryLat: null,
      deliveryLng: null,
    });

    await shipmentService.updateShipment({ id: draft.shipperId }, draft.id, { pickupDate: '2026-10-10' });

    expect(shipmentRepository.updateShipment).toHaveBeenCalledWith(draft.id, {
      pickupDate: new Date('2026-10-10T00:00:00.000Z'),
    });
  });

  it('rejects updates when an accepted bid exists', async () => {
    shipmentRepository.findShipmentForUpdate.mockResolvedValue({
      ...draft,
      status: 'PUBLISHED',
      bids: [{ id: 'accepted-bid' }],
    });

    await expect(
      shipmentService.updateShipment({ id: draft.shipperId }, draft.id, { goodsType: 'Furniture' }),
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(shipmentRepository.updateShipment).not.toHaveBeenCalled();
  });

  it('returns not found for an unknown shipment', async () => {
    shipmentRepository.findShipmentForUpdate.mockResolvedValue(null);

    await expect(
      shipmentService.updateShipment({ id: draft.shipperId }, draft.id, { goodsType: 'Furniture' }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

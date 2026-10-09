import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/modules/shipment/shipment.repository.js', () => ({
  softRemoveShipmentWithAudit: vi.fn(),
  findShipmentById: vi.fn(),
}));
vi.mock('../../../src/modules/shipment/shipment.storage.js', () => ({}));
vi.mock('../../../src/modules/notification/notification.service.js', () => ({ shipmentRemoved: vi.fn() }));

import * as shipmentRepository from '../../../src/modules/shipment/shipment.repository.js';
import * as notificationService from '../../../src/modules/notification/notification.service.js';
import * as shipmentService from '../../../src/modules/shipment/shipment.service.js';

const admin = { id: 'admin-id', role: 'ADMIN' };
const shipmentId = 'shipment-id';
const reason = 'Listing violates marketplace rules';

beforeEach(() => vi.clearAllMocks());

describe('admin shipment moderation', () => {
  it('records removal, closes pending bids, and notifies affected transporters', async () => {
    shipmentRepository.softRemoveShipmentWithAudit.mockResolvedValue({
      moderationId: 'moderation-id',
      pendingBidIds: ['bid-a', 'bid-b'],
      transporterIds: ['transporter-a', 'transporter-b'],
    });

    const result = await shipmentService.softRemoveShipment(admin, shipmentId, reason);

    expect(shipmentRepository.softRemoveShipmentWithAudit).toHaveBeenCalledWith(expect.objectContaining({
      id: shipmentId,
      adminId: admin.id,
      reason,
    }));
    expect(notificationService.shipmentRemoved).toHaveBeenCalledWith(shipmentId, ['transporter-a', 'transporter-b']);
    expect(result).toMatchObject({ id: shipmentId, moderationId: 'moderation-id', removed: true, declinedBids: 2 });
  });

  it('rejects removal by non-admin users', async () => {
    await expect(shipmentService.softRemoveShipment({ id: 'user-id', role: 'SHIPPER' }, shipmentId, reason))
      .rejects.toMatchObject({ statusCode: 403 });
    expect(shipmentRepository.softRemoveShipmentWithAudit).not.toHaveBeenCalled();
  });

  it('returns not found for an unknown shipment and conflict for an already removed one', async () => {
    shipmentRepository.softRemoveShipmentWithAudit.mockResolvedValue(null);
    shipmentRepository.findShipmentById.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: shipmentId, removedAt: new Date() });

    await expect(shipmentService.softRemoveShipment(admin, shipmentId, reason)).rejects.toMatchObject({ statusCode: 404 });
    await expect(shipmentService.softRemoveShipment(admin, shipmentId, reason)).rejects.toMatchObject({ statusCode: 409 });
  });
});

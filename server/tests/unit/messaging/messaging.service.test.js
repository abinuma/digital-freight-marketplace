import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/modules/messaging/messaging.repository.js', () => ({
  findShipmentParticipant: vi.fn(),
  findShipmentMessages: vi.fn(),
  createMessage: vi.fn(),
}));
vi.mock('../../../src/modules/notification/notification.service.js', () => ({ newMessage: vi.fn() }));

import * as messagingRepository from '../../../src/modules/messaging/messaging.repository.js';
import * as notificationService from '../../../src/modules/notification/notification.service.js';
import * as messagingService from '../../../src/modules/messaging/messaging.service.js';

const shipper = { id: 'shipper-id', role: 'SHIPPER' };
const shipmentId = 'shipment-id';

beforeEach(() => vi.clearAllMocks());

describe('messaging service', () => {
  it('allows the shipment owner to send a message and triggers a notification', async () => {
    messagingRepository.findShipmentParticipant.mockResolvedValue({ id: shipmentId, shipperId: shipper.id, removedAt: null, bids: [] });
    const message = { id: 'message-id', shipmentId, senderId: shipper.id, content: 'Hello' };
    messagingRepository.createMessage.mockResolvedValue(message);

    await expect(messagingService.sendMessage(shipper, shipmentId, 'Hello')).resolves.toEqual(message);
    expect(notificationService.newMessage).toHaveBeenCalledWith(shipmentId, shipper.id, 'Hello');
  });

  it('rejects a nonparticipant and does not create a message', async () => {
    messagingRepository.findShipmentParticipant.mockResolvedValue({ id: shipmentId, shipperId: 'another-shipper', removedAt: null, bids: [] });

    await expect(messagingService.sendMessage(shipper, shipmentId, 'Hello')).rejects.toMatchObject({ statusCode: 403 });
    expect(messagingRepository.createMessage).not.toHaveBeenCalled();
  });

  it('rejects shipment conversations after administrative removal', async () => {
    messagingRepository.findShipmentParticipant.mockResolvedValue({ id: shipmentId, shipperId: shipper.id, removedAt: new Date(), bids: [] });

    await expect(messagingService.listMessages(shipper, shipmentId)).rejects.toMatchObject({ statusCode: 404 });
    expect(messagingRepository.findShipmentMessages).not.toHaveBeenCalled();
  });
});

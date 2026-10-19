import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/modules/messaging/messaging.repository.js', () => ({
  findConversation: vi.fn(),
  findConversationMessages: vi.fn(),
  findConversationLastMessage: vi.fn(),
  findConversationBids: vi.fn(),
  listConversations: vi.fn(),
  createMessage: vi.fn(),
}));
vi.mock('../../../src/modules/notification/notification.service.js', () => ({
  newMessage: vi.fn(),
  markNotificationsReadByReference: vi.fn(),
}));

import * as messagingRepository from '../../../src/modules/messaging/messaging.repository.js';
import * as notificationService from '../../../src/modules/notification/notification.service.js';
import * as messagingService from '../../../src/modules/messaging/messaging.service.js';

const shipper = { id: 'shipper-id', role: 'SHIPPER' };
const conversationId = 'conversation-id';

beforeEach(() => vi.clearAllMocks());

describe('messaging service', () => {
  it('allows a participant to send a message and triggers a notification', async () => {
    messagingRepository.findConversation.mockResolvedValue({
      id: conversationId,
      shipperId: shipper.id,
      transporterId: 'transporter-id',
    });
    const message = { id: 'message-id', conversationId, senderId: shipper.id, content: 'Hello' };
    messagingRepository.createMessage.mockResolvedValue(message);

    await expect(messagingService.sendMessage(shipper, conversationId, 'Hello')).resolves.toEqual(message);
    expect(notificationService.newMessage).toHaveBeenCalledWith(conversationId, shipper.id, 'Hello');
  });

  it('rejects a nonparticipant and does not create a message', async () => {
    messagingRepository.findConversation.mockResolvedValue({
      id: conversationId,
      shipperId: 'other-shipper',
      transporterId: 'transporter-id',
    });

    await expect(messagingService.sendMessage(shipper, conversationId, 'Hello')).rejects.toMatchObject({ statusCode: 403 });
    expect(messagingRepository.createMessage).not.toHaveBeenCalled();
  });

  it('rejects non-existent conversations', async () => {
    messagingRepository.findConversation.mockResolvedValue(null);

    await expect(messagingService.listMessages(shipper, conversationId)).rejects.toMatchObject({ statusCode: 404 });
    expect(messagingRepository.findConversationMessages).not.toHaveBeenCalled();
  });

  it('serializes counterpart shipper profile photo and image for a transporter viewing conversations', async () => {
    const transporter = { id: 'transporter-id', role: 'TRANSPORTER' };
    messagingRepository.listConversations.mockResolvedValue([
      {
        id: 'c-1',
        shipperId: 'shipper-1',
        transporterId: transporter.id,
        shipmentIds: ['s-1'],
        updatedAt: new Date('2026-10-17T09:00:00Z'),
        shipper: {
          id: 'shipper-1',
          name: 'Shipper Co',
          image: 'https://cdn.example.test/shipper-photo.jpg',
          city: 'Hawassa',
        },
        transporter: {
          id: transporter.id,
          name: 'Fast Transporter',
          image: null,
        },
        messages: [{ id: 'm-1', content: 'Hello' }],
      },
    ]);

    const result = await messagingService.listConversations(transporter);
    expect(result).toHaveLength(1);
    expect(result[0].counterpart.name).toBe('Shipper Co');
    expect(result[0].counterpart.profilePhoto).toBe('https://cdn.example.test/shipper-photo.jpg');
    expect(result[0].counterpart.image).toBe('https://cdn.example.test/shipper-photo.jpg');
  });

  it('serializes shipment shipper profilePhoto and image in listConversationBids', async () => {
    const transporter = { id: 'transporter-id', role: 'TRANSPORTER' };
    messagingRepository.findConversation.mockResolvedValue({
      id: conversationId,
      shipperId: 'shipper-id',
      transporterId: transporter.id,
    });
    messagingRepository.findConversationBids.mockResolvedValue([
      {
        id: 'b-1',
        price: '35000',
        shipment: {
          id: 's-1',
          goodsDescription: 'Textiles',
          weightKg: '2500',
          shipper: {
            id: 'shipper-id',
            name: 'Textile Shipper',
            image: 'https://cdn.example.test/textile-shipper.png',
          },
        },
      },
    ]);

    const bids = await messagingService.listConversationBids(transporter, conversationId);
    expect(bids).toHaveLength(1);
    expect(bids[0].price).toBe(35000);
    expect(bids[0].shipment.shipper.profilePhoto).toBe('https://cdn.example.test/textile-shipper.png');
    expect(bids[0].shipment.shipper.image).toBe('https://cdn.example.test/textile-shipper.png');
  });
});

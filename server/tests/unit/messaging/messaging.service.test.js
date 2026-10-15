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
});

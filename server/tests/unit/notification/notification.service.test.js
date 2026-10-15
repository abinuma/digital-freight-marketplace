import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/modules/notification/notification.repository.js', () => ({
  createNotification: vi.fn(),
  findNotifications: vi.fn(),
  markNotificationRead: vi.fn(),
  markAllNotificationsRead: vi.fn(),
  findBidNotificationDetails: vi.fn(),
  findAcceptedTransporterForShipment: vi.fn(),
  findShipmentRemovalNotificationDetails: vi.fn(),
  findMessageNotificationDetails: vi.fn(),
}));

vi.mock('../../../src/modules/notification/email.service.js', () => ({ sendEmail: vi.fn() }));
vi.mock('../../../src/shared/utils/logger.js', () => ({ logger: { error: vi.fn(), warn: vi.fn() } }));

import * as notificationRepository from '../../../src/modules/notification/notification.repository.js';
import { sendEmail } from '../../../src/modules/notification/email.service.js';
import * as notificationService from '../../../src/modules/notification/notification.service.js';

beforeEach(() => vi.clearAllMocks());

describe('notification service', () => {
  it('stores a bid notification and dispatches its email to the shipper', async () => {
    notificationRepository.findBidNotificationDetails.mockResolvedValue({
      id: 'bid-id',
      price: '1000.00',
      transporter: { id: 'transporter-id', name: 'Transporter', email: 'transporter@example.test' },
      shipment: {
        goodsDescription: 'Furniture',
        pickupLocation: 'Addis Ababa',
        deliveryLocation: 'Hawassa',
        shipper: { id: 'shipper-id', name: 'Shipper', email: 'shipper@example.test' },
      },
    });

    await notificationService.bidReceived('bid-id');

    expect(notificationRepository.createNotification).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'shipper-id',
      type: 'BID_RECEIVED',
      referenceId: 'bid-id',
    }));
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'shipper@example.test',
      type: 'BID_RECEIVED',
    }));
  });

  it('does not prevent email dispatch if saving the in-app record fails', async () => {
    notificationRepository.findBidNotificationDetails.mockResolvedValue({
      id: 'bid-id',
      price: '1000.00',
      transporter: { id: 'transporter-id', name: 'Transporter', email: 'transporter@example.test' },
      shipment: { goodsDescription: 'Furniture', shipper: { id: 'shipper-id', name: 'Shipper', email: 'shipper@example.test' } },
    });
    notificationRepository.createNotification.mockRejectedValue(new Error('database unavailable'));

    await notificationService.bidReceived('bid-id');

    expect(sendEmail).toHaveBeenCalledOnce();
  });

  it('stores shipper message notifications for active bidders but emails only the accepted transporter', async () => {
    notificationRepository.findMessageNotificationDetails.mockResolvedValue({
      shipper: { id: 'shipper-id', name: 'Shipper', email: 'shipper@example.test' },
      transporter: { id: 'accepted-id', name: 'Accepted', email: 'accepted@example.test' },
    });

    await notificationService.newMessage('conversation-id', 'shipper-id', 'Update');

    expect(notificationRepository.createNotification).toHaveBeenCalledTimes(1);
    expect(notificationRepository.createNotification).toHaveBeenCalledWith(expect.objectContaining({ userId: 'accepted-id', type: 'NEW_MESSAGE' }));
    expect(sendEmail).toHaveBeenCalledOnce();
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'accepted@example.test' }));
  });

  it('lists notifications with pagination and scopes reads to the owner', async () => {
    notificationRepository.findNotifications.mockResolvedValue({ notifications: [], total: 0 });
    notificationRepository.markNotificationRead.mockResolvedValue(null);

    await expect(notificationService.listNotifications('user-id', { page: 2, limit: 10 })).resolves.toEqual({
      notifications: [],
      pagination: { page: 2, limit: 10, total: 0, totalPages: 0 },
    });
    expect(notificationRepository.findNotifications).toHaveBeenCalledWith('user-id', { skip: 10, take: 10 });
    await expect(notificationService.markNotificationRead('user-id', 'other-user-notification'))
      .rejects.toMatchObject({ statusCode: 404 });
    expect(notificationRepository.markNotificationRead).toHaveBeenCalledWith('user-id', 'other-user-notification');
  });

  it('returns the number of unread notifications marked read', async () => {
    notificationRepository.markAllNotificationsRead.mockResolvedValue({ count: 3 });

    await expect(notificationService.markAllNotificationsRead('user-id')).resolves.toEqual({ updated: 3 });
    expect(notificationRepository.markAllNotificationsRead).toHaveBeenCalledWith('user-id');
  });
});

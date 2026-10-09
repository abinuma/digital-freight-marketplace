import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { notificationService } = vi.hoisted(() => ({
  notificationService: {
    listNotifications: vi.fn(),
    markNotificationRead: vi.fn(),
    markAllNotificationsRead: vi.fn(),
  },
}));

vi.mock('../../../src/modules/notification/notification.service.js', () => notificationService);

import notificationRouter from '../../../src/modules/notification/notification.routes.js';

const user = { id: 'f92b3d47-f7da-4a12-b2db-35d902438f23' };
const app = express();
app.use(express.json());
app.use((req, res, next) => { req.user = user; next(); });
app.use('/notifications', notificationRouter);
app.use((error, req, res, _next) => res.status(error.statusCode || 500).json({ error: { message: error.message } }));

beforeEach(() => vi.clearAllMocks());

describe('notification API routes', () => {
  it('returns the current user notifications and pagination', async () => {
    notificationService.listNotifications.mockResolvedValue({
      notifications: [{ id: 'notification-id', read: false }],
      pagination: { page: 2, limit: 10, total: 11, totalPages: 2 },
    });

    const response = await request(app).get('/notifications?page=2&limit=10');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([{ id: 'notification-id', read: false }]);
    expect(notificationService.listNotifications).toHaveBeenCalledWith(user.id, { page: 2, limit: 10 });
  });

  it('rejects invalid pagination before querying the service', async () => {
    const response = await request(app).get('/notifications?limit=1000');

    expect(response.status).toBe(400);
    expect(notificationService.listNotifications).not.toHaveBeenCalled();
  });

  it('marks one notification or all notifications read for the current user', async () => {
    const notification = { id: '0ecb5efc-f011-4fc9-92a8-96df1682e579', read: true };
    notificationService.markNotificationRead.mockResolvedValue(notification);
    notificationService.markAllNotificationsRead.mockResolvedValue({ updated: 4 });

    const single = await request(app).patch(`/notifications/${notification.id}/read`);
    const all = await request(app).patch('/notifications/read-all');

    expect(single.status).toBe(200);
    expect(single.body.data).toEqual(notification);
    expect(all.status).toBe(200);
    expect(all.body.data).toEqual({ updated: 4 });
    expect(notificationService.markNotificationRead).toHaveBeenCalledWith(user.id, notification.id);
    expect(notificationService.markAllNotificationsRead).toHaveBeenCalledWith(user.id);
  });
});

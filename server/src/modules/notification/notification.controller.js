import * as notificationService from './notification.service.js';

export async function listNotifications(req, res, next) {
  try {
    const { notifications, pagination } = await notificationService.listNotifications(req.user.id, req.query);
    return res.json({ data: notifications, meta: { pagination } });
  } catch (error) {
    return next(error);
  }
}

export async function markNotificationRead(req, res, next) {
  try {
    const notification = await notificationService.markNotificationRead(req.user.id, req.params.id);
    return res.json({ data: notification });
  } catch (error) {
    return next(error);
  }
}

export async function markAllNotificationsRead(req, res, next) {
  try {
    const result = await notificationService.markAllNotificationsRead(req.user.id);
    return res.json({ data: result });
  } catch (error) {
    return next(error);
  }
}

export async function markNotificationsReadByReference(req, res, next) {
  try {
    const result = await notificationService.markNotificationsReadByReference(req.user.id, req.params.referenceId);
    return res.json({ data: result });
  } catch (error) {
    return next(error);
  }
}

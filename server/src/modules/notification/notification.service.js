import { logger } from '../../shared/utils/logger.js';
import { sendEmail } from './email.service.js';
import * as notificationRepository from './notification.repository.js';
import { formatPagination, getPagination } from '../../shared/utils/pagination.js';
import { AppError } from '../../shared/utils/AppError.js';

async function notify(recipient, email) {
  if (!recipient?.email) return;
  try {
    await sendEmail({
      to: recipient.email,
      recipientName: recipient.name,
      ...email,
    });
  } catch (error) {
    // Email is a side effect: a delivery issue must not undo a completed marketplace action.
    logger.error({ err: error, type: email.type, recipient: recipient.email }, 'Could not dispatch notification email');
  }
}

async function safely(type, action) {
  try {
    await action();
  } catch (error) {
    logger.error({ err: error, type }, 'Could not prepare notification email');
  }
}

async function saveInAppNotification({ userId, type, title, message, referenceId }) {
  try {
    await notificationRepository.createNotification({ userId, type, title, message, referenceId });
  } catch (error) {
    logger.error({ err: error, type, userId }, 'Could not save in-app notification');
  }
}

export async function listNotifications(userId, query = {}) {
  const { page, limit, skip, take } = getPagination(query);
  const { notifications, total } = await notificationRepository.findNotifications(userId, { skip, take, unreadOnly: query.unreadOnly });
  return { notifications, pagination: formatPagination({ page, limit, total }) };
}

export async function markNotificationRead(userId, id) {
  const notification = await notificationRepository.markNotificationRead(userId, id);
  if (!notification) throw new AppError('Notification was not found', 404);
  return notification;
}

export async function markAllNotificationsRead(userId) {
  const result = await notificationRepository.markAllNotificationsRead(userId);
  return { updated: result.count };
}

export async function markNotificationsReadByReference(userId, referenceId) {
  const result = await notificationRepository.markNotificationsReadByReference(userId, referenceId);
  return { updated: result.count };
}

export function bidReceived(bidId) {
  return safely('BID_RECEIVED', async () => {
    const bid = await notificationRepository.findBidNotificationDetails(bidId);
    if (!bid) return;
    await saveInAppNotification({
      userId: bid.shipment.shipper.id,
      type: 'BID_RECEIVED',
      title: `New bid for ${bid.shipment.goodsDescription}`,
      message: `${bid.transporter.name} submitted a bid for your shipment.`,
      referenceId: bidId,
    });
    await notify(bid.shipment.shipper, {
      type: 'BID_RECEIVED',
      shipment: bid.shipment,
      bid: { price: Number(bid.price) },
      senderName: bid.transporter.name,
    });
  });
}

export function bidStatusChanged(bidId, type) {
  return safely(type, async () => {
    const bid = await notificationRepository.findBidNotificationDetails(bidId);
    if (!bid) return;
    const title = type === 'BID_ACCEPTED' ? 'Your bid was accepted' : 'Your bid was declined';
    const message = type === 'BID_ACCEPTED'
      ? `Your bid for ${bid.shipment.goodsDescription} was accepted.`
      : `Your bid for ${bid.shipment.goodsDescription} was declined.`;
    await saveInAppNotification({ userId: bid.transporter.id, type, title, message, referenceId: bidId });
    await notify(bid.transporter, {
      type,
      shipment: bid.shipment,
      bid: { price: Number(bid.price) },
    });
  });
}

export function shipmentCompleted(shipmentId) {
  return safely('SHIPMENT_COMPLETED', async () => {
    const acceptedBid = await notificationRepository.findAcceptedTransporterForShipment(shipmentId);
    if (!acceptedBid) return;
    await saveInAppNotification({
      userId: acceptedBid.transporter.id,
      type: 'SHIPMENT_COMPLETED',
      title: 'Shipment completed',
      message: `${acceptedBid.shipment.goodsDescription} has been marked as completed.`,
      referenceId: shipmentId,
    });
    await notify(acceptedBid.transporter, {
      type: 'SHIPMENT_COMPLETED',
      shipment: acceptedBid.shipment,
    });
  });
}

export function shipmentRemoved(shipmentId, transporterIds) {
  if (transporterIds.length === 0) return Promise.resolve();
  return safely('SHIPMENT_REMOVED', async () => {
    const details = await notificationRepository.findShipmentRemovalNotificationDetails(shipmentId, transporterIds);
    if (!details) return;
    await Promise.all(details.transporters.map((transporter) => saveInAppNotification({
      userId: transporter.id,
      type: 'SHIPMENT_REMOVED',
      title: 'Shipment listing removed',
      message: `The listing for ${details.shipment.goodsDescription} was removed by an administrator. Your pending bid was closed.`,
      referenceId: shipmentId,
    })));
    await Promise.all(details.transporters.map((transporter) => notify(transporter, {
      type: 'SHIPMENT_REMOVED',
      shipment: details.shipment,
    })));
  });
}

export function newMessage(conversationId, senderId, content) {
  return safely('NEW_MESSAGE', async () => {
    const conversation = await notificationRepository.findMessageNotificationDetails(conversationId);
    if (!conversation) return;
    const participants = [conversation.shipper, conversation.transporter];
    const sender = participants.find((participant) => participant.id === senderId);
    if (!sender) return;
    const recipient = participants.find((participant) => participant.id !== senderId);
    if (!recipient) return;

    await saveInAppNotification({
      userId: recipient.id,
      type: 'NEW_MESSAGE',
      title: 'New message',
      message: `${sender.name} sent you a message.`,
      referenceId: conversationId,
    });
    await notify(recipient, {
      type: 'NEW_MESSAGE',
      senderName: sender.name,
      content,
    });
  });
}

export function welcome(user) {
  return safely('WELCOME', () => notify(user, { type: 'WELCOME' }));
}

export function passwordReset(user, url) {
  return safely('PASSWORD_RESET', () => notify(user, { type: 'PASSWORD_RESET', content: url }));
}

export function journeyPlanCapacityReached(userId, plan) {
  return safely('JOURNEY_PLAN_FULL', async () => {
    await saveInAppNotification({
      userId,
      type: 'JOURNEY_PLAN_FULL',
      title: 'Journey Plan Capacity Reached',
      message: `Your journey plan from ${plan.originCity} to ${plan.destinationCity} has reached maximum capacity. You are ready to collect the loads and go!`,
      referenceId: plan.id,
    });
  });
}


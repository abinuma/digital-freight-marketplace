import { logger } from '../../shared/utils/logger.js';
import { isEmailConfigured, sendEmail } from './email.service.js';
import * as notificationRepository from './notification.repository.js';

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
  if (!isEmailConfigured()) {
    logger.warn({ type }, 'Notification email skipped because Brevo is not configured');
    return;
  }

  try {
    await action();
  } catch (error) {
    logger.error({ err: error, type }, 'Could not prepare notification email');
  }
}

export function bidReceived(bidId) {
  return safely('BID_RECEIVED', async () => {
    const bid = await notificationRepository.findBidNotificationDetails(bidId);
    if (!bid) return;
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
    await Promise.all(details.transporters.map((transporter) => notify(transporter, {
      type: 'SHIPMENT_REMOVED',
      shipment: details.shipment,
    })));
  });
}

export function newMessage(shipmentId, senderId, content) {
  return safely('NEW_MESSAGE', async () => {
    const details = await notificationRepository.findMessageNotificationDetails(shipmentId, senderId);
    if (!details) return;
    const acceptedTransporter = details.shipment.bids[0]?.transporter;
    const recipient = senderId === details.shipment.shipperId ? acceptedTransporter : details.shipment.shipper;
    if (!recipient) return;
    await notify(recipient, {
      type: 'NEW_MESSAGE',
      shipment: details.shipment,
      senderName: details.sender?.name,
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

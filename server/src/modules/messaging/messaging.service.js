import { AppError } from '../../shared/utils/AppError.js';
import * as messagingRepository from './messaging.repository.js';
import * as notificationService from '../notification/notification.service.js';

async function requireShipmentParticipant(user, shipmentId) {
  const shipment = await messagingRepository.findShipmentParticipant(shipmentId, user.id);
  if (!shipment || shipment.removedAt) throw new AppError('Shipment was not found', 404);

  const isShipper = user.role === 'SHIPPER' && shipment.shipperId === user.id;
  const isActiveBidder = user.role === 'TRANSPORTER' && shipment.bids.length > 0;
  if (!isShipper && !isActiveBidder) {
    throw new AppError('You are not authorized to access this shipment conversation', 403);
  }
}

export async function listMessages(user, shipmentId) {
  await requireShipmentParticipant(user, shipmentId);
  return messagingRepository.findShipmentMessages(shipmentId);
}

export async function sendMessage(user, shipmentId, content) {
  await requireShipmentParticipant(user, shipmentId);
  const message = await messagingRepository.createMessage(shipmentId, user.id, content);
  await notificationService.newMessage(shipmentId, user.id, content);
  return message;
}

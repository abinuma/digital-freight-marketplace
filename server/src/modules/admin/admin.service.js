import * as shipmentService from '../shipment/shipment.service.js';
import { AppError } from '../../shared/utils/AppError.js';
import { formatPagination, getPagination } from '../../shared/utils/pagination.js';
import * as adminRepository from './admin.repository.js';

function mapMissingUser(error) {
  if (error?.code === 'P2025') throw new AppError('User was not found', 404);
  throw error;
}

export async function listUsers(query = {}) {
  const { page, limit, skip, take } = getPagination(query);
  const { users, total } = await adminRepository.findUsers({ ...query, skip, take });
  return { users, pagination: formatPagination({ page, limit, total }) };
}

export async function suspendUser(id, reason) {
  try {
    return await adminRepository.updateUserStatus(id, 'SUSPENDED', reason);
  } catch (error) {
    mapMissingUser(error);
  }
}

export async function activateUser(id) {
  try {
    return await adminRepository.updateUserStatus(id, 'ACTIVE', null);
  } catch (error) {
    mapMissingUser(error);
  }
}

export async function getMetrics() {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [users, shipments] = await Promise.all([
    adminRepository.getUserMetrics(since),
    shipmentService.getAdminShipmentMetrics(),
  ]);
  return { ...users, shipments };
}

export function listShipments(user, query) {
  return shipmentService.listAdminShipments(user, query);
}

export function removeShipment(user, id) {
  return shipmentService.softRemoveShipment(user, id);
}

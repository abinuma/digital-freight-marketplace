import { apiClient } from '../../shared/api/client.js';

const unwrap = (response) => response.data.data;

export async function getDashboardSummary() {
  return unwrap(await apiClient.get('/shipments/dashboard/summary'));
}

export async function listShipments(params) {
  const response = await apiClient.get('/shipments', { params });
  return { shipments: response.data.data, pagination: response.data.meta.pagination };
}

export async function getShipment(id) {
  return unwrap(await apiClient.get(`/shipments/${id}`));
}

export async function saveShipment({ id, values }) {
  return id
    ? unwrap(await apiClient.patch(`/shipments/${id}`, values))
    : unwrap(await apiClient.post('/shipments', values));
}

export async function uploadShipmentImages({ id, files }) {
  const body = new FormData();
  files.forEach((file) => body.append('images', file));
  return unwrap(await apiClient.post(`/shipments/${id}/images`, body));
}

export async function removeShipmentImage({ shipmentId, imageId }) {
  return unwrap(await apiClient.delete(`/shipments/${shipmentId}/images/${imageId}`));
}

export async function transitionShipment({ id, action }) {
  return unwrap(await apiClient.patch(`/shipments/${id}/${action}`));
}

export async function listShipmentBids(id) {
  const response = await apiClient.get(`/shipments/${id}/bids`, { params: { limit: 100 } });
  return response.data.data;
}

export async function getUserProfile(id) {
  return unwrap(await apiClient.get(`/users/${id}`));
}

export async function decideBid({ shipmentId, bidId, action, declineReason }) {
  return unwrap(await apiClient.patch(`/shipments/${shipmentId}/bids/${bidId}/${action}`, declineReason ? { declineReason } : {}));
}

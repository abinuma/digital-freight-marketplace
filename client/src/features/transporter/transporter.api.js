import { apiClient } from '../../shared/api/client.js';

const unwrap = (response) => response.data.data;

export async function listAvailableShipments(params) {
  const response = await apiClient.get('/shipments', { params });
  return { shipments: response.data.data, pagination: response.data.meta.pagination };
}

export async function getShipment(id) {
  return unwrap(await apiClient.get(`/shipments/${id}`));
}

export async function listMyBids(params) {
  const response = await apiClient.get('/bids/my', { params });
  return { bids: response.data.data, pagination: response.data.meta.pagination };
}

export async function submitBid({ shipmentId, values, bidId }) {
  const body = { ...values, pickupDate: new Date(values.pickupDate).toISOString() };
  return bidId
    ? unwrap(await apiClient.patch(`/shipments/${shipmentId}/bids/${bidId}`, body))
    : unwrap(await apiClient.post(`/shipments/${shipmentId}/bids`, body));
}

export async function withdrawBid({ shipmentId, bidId }) {
  return unwrap(await apiClient.patch(`/shipments/${shipmentId}/bids/${bidId}/withdraw`));
}

export async function getShipmentMessages(shipmentId) {
  return unwrap(await apiClient.get(`/shipments/${shipmentId}/messages`));
}

export async function sendShipmentMessage({ shipmentId, content }) {
  return unwrap(await apiClient.post(`/shipments/${shipmentId}/messages`, { content }));
}

export async function listNotifications(limit = 10) {
  const response = await apiClient.get('/notifications', { params: { limit } });
  return { notifications: response.data.data, pagination: response.data.meta.pagination };
}

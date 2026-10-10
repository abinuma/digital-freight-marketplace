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

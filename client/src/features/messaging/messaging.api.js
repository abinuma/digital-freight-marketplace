import { apiClient } from '../../shared/api/client.js';

export async function getShipmentMessages(shipmentId) {
  const { data } = await apiClient.get(`/shipments/${shipmentId}/messages`);
  return data.data;
}

export async function sendShipmentMessage({ shipmentId, content }) {
  const { data } = await apiClient.post(`/shipments/${shipmentId}/messages`, { content });
  return data.data;
}

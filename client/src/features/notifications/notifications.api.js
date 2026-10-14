import { apiClient } from '../../shared/api/client.js';

export async function listNotifications(params) {
  const response = await apiClient.get('/notifications', { params });
  return { notifications: response.data.data, pagination: response.data.meta.pagination };
}

export async function markNotificationRead(id) {
  const { data } = await apiClient.patch(`/notifications/${id}/read`);
  return data.data;
}

export async function markAllNotificationsRead() {
  const { data } = await apiClient.patch('/notifications/read-all');
  return data.data;
}

export async function markNotificationsReadByReference(referenceId) {
  const { data } = await apiClient.patch(`/notifications/reference/${referenceId}/read`);
  return data.data;
}

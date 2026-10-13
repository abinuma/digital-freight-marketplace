import { apiClient } from '../../shared/api/client.js';

export async function getPublicProfile(userId) {
  const { data } = await apiClient.get(`/users/${userId}`);
  return data.data;
}

export async function updateProfile(userId, profile) {
  const { data } = await apiClient.patch(`/users/${userId}`, profile);
  return data.data;
}

export async function uploadProfilePhoto(userId, file) {
  const formData = new FormData();
  formData.append('photo', file);
  const { data } = await apiClient.post(`/users/${userId}/profile-photo`, formData);
  return data.data;
}

export async function getVehicle(userId) {
  const { data } = await apiClient.get(`/users/${userId}/vehicle`);
  return data.data;
}

export async function updateVehicle(userId, vehicle) {
  const { data } = await apiClient.put(`/users/${userId}/vehicle`, vehicle);
  return data.data;
}

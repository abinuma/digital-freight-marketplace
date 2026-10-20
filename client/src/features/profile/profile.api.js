import { apiClient } from '../../shared/api/client.js';

export async function getPublicProfile(userId) {
  const { data } = await apiClient.get(`/users/${userId}`);
  return data.data;
}

export async function listUserReviews(userId) {
  const { data } = await apiClient.get(`/users/${userId}/reviews`, { params: { limit: 5 } });
  return { reviews: data.data, pagination: data.meta.pagination };
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

export async function uploadVehiclePhoto(userId, file) {
  const formData = new FormData();
  formData.append('photo', file);
  const { data } = await apiClient.post(`/users/${userId}/vehicle-photo`, formData);
  return data.data;
}


export async function setLoadAvailability(userId, lookingForLoads) {
  const { data } = await apiClient.patch(`/users/${userId}/availability`, { lookingForLoads });
  return data.data;
}

export async function listAvailableTransporters(city) {
  const { data } = await apiClient.get('/users/available-transporters', { params: { city } });
  return data.data;
}

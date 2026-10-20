import { apiClient } from '../../shared/api/client.js'

const unwrap = (response) => response.data.data

export async function getAdminMetrics() {
  return unwrap(await apiClient.get('/admin/metrics'))
}

export async function listAdminUsers(params) {
  const query = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value != null),
  )
  const response = await apiClient.get('/admin/users', { params: query })
  return { users: response.data.data, pagination: response.data.meta.pagination }
}

export async function updateAdminUserStatus({ id, action, reason }) {
  return unwrap(await apiClient.patch(`/admin/users/${id}/${action}`, action === 'suspend' ? { reason } : {}))
}

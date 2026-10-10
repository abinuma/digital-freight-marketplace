import { apiClient } from '../../shared/api/client.js'

export async function listShipmentReviews(shipmentId) {
  const response = await apiClient.get(`/shipments/${shipmentId}/reviews`, { params: { limit: 100 } })
  return { reviews: response.data.data, pagination: response.data.meta.pagination }
}

export async function createShipmentReview({ shipmentId, rating, comment }) {
  const response = await apiClient.post(`/shipments/${shipmentId}/reviews`, { rating, comment: comment.trim() || null })
  return response.data.data
}

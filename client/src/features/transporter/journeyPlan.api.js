import { apiClient } from '../../shared/api/client.js';

const unwrap = (response) => response.data.data;

export async function createJourneyPlan(values) {
  const body = toPlanBody(values);
  return unwrap(await apiClient.post('/journey-plans', body));
}

const toPlanBody = (values) => ({
  ...values,
  departureDate: new Date(values.departureDate).toISOString(),
  fullLoadPrice: Number(values.fullLoadPrice),
});

export async function updateJourneyPlan(id, values) {
  return unwrap(await apiClient.put(`/journey-plans/${id}`, toPlanBody(values)));
}

export async function deleteJourneyPlan(id) {
  return unwrap(await apiClient.delete(`/journey-plans/${id}`));
}

export async function listMyJourneyPlans(params = {}) {
  const query = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value != null),
  );
  const response = await apiClient.get('/journey-plans/my', { params: query });
  return {
    journeyPlans: response.data.data,
    pagination: response.data.meta?.pagination || { page: 1, limit: 10, total: response.data.data?.length ?? 0, totalPages: 1 },
  };
}

export async function getJourneyPlan(id) {
  return unwrap(await apiClient.get(`/journey-plans/${id}`));
}

export async function assignBidToJourneyPlan({ journeyPlanId, bidId }) {
  return unwrap(await apiClient.post(`/journey-plans/${journeyPlanId}/assignments`, { bidId }));
}

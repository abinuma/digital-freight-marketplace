import { apiClient } from '../../shared/api/client.js';

export async function listConversations() {
  const { data } = await apiClient.get('/messages/conversations');
  return data.data;
}

export async function getConversationMessages(conversationId) {
  const { data } = await apiClient.get(`/messages/conversations/${conversationId}`);
  return data.data;
}

export async function sendConversationMessage({ conversationId, content }) {
  const { data } = await apiClient.post(`/messages/conversations/${conversationId}`, { content });
  return data.data;
}

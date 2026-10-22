import { apiClient, apiOrigin } from '../../shared/api/client.js';

export async function getCurrentUser() {
  const { data } = await apiClient.get('/auth/me');
  return data.user;
}

export async function loginWithEmail(credentials) {
  const { data } = await apiClient.post('/auth/login', credentials);
  return data;
}

export async function submitSuspensionAppeal(appeal) {
  const { data } = await apiClient.post('/auth/suspension-appeals', appeal);
  return data.data;
}

export async function sendRegistrationVerificationCode(email) {
  const { data } = await apiClient.post('/auth/send-verification-code', { email });
  return data;
}

export async function registerWithEmail(details) {
  const { data } = await apiClient.post('/auth/register', details);
  return data;
}

export async function requestPasswordReset(email) {
  const { data } = await apiClient.post('/auth/forgot-password', { email });
  return data;
}

export async function resetPassword({ token, newPassword }) {
  const { data } = await apiClient.post('/auth/reset-password', { token, newPassword });
  return data;
}

export async function verifyResetToken(token) {
  const { data } = await apiClient.get('/auth/verify-reset-token', { params: { token } });
  return data;
}


export async function logoutCurrentUser() {
  const { data } = await apiClient.post('/auth/logout');
  return data;
}

export async function startGoogleSignIn(callbackURL) {
  const { data } = await apiClient.post('/api/auth/sign-in/social', {
    provider: 'google',
    callbackURL,
  }, { baseURL: apiOrigin });
  if (!data.url) throw new Error('Google sign-in did not return an authorization URL');
  return data.url;
}

export async function completeCurrentUserProfile(profile) {
  const { data } = await apiClient.post('/auth/complete-profile', profile);
  return data.user;
}

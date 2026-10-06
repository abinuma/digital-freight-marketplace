const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

async function readResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error?.message || payload.message || 'The request could not be completed');
    error.status = response.status;
    throw error;
  }
  return payload;
}

export async function getCurrentUser() {
  const response = await fetch(`${apiBaseUrl}/api/v1/auth/me`, { credentials: 'include' });
  return (await readResponse(response)).user;
}

export async function startGoogleSignIn(callbackURL) {
  const response = await fetch(`${apiBaseUrl}/api/auth/sign-in/social`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ provider: 'google', callbackURL }),
  });
  const result = await readResponse(response);
  if (!result.url) throw new Error('Google sign-in did not return an authorization URL');
  return result.url;
}

export async function completeCurrentUserProfile(profile) {
  const response = await fetch(`${apiBaseUrl}/api/v1/auth/complete-profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(profile),
  });
  return (await readResponse(response)).user;
}

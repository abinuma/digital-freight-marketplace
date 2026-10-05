import * as authService from './auth.service.js';

function forwardAuthResponse(response, res, { created = false } = {}) {
  const cookies = response.headers.getSetCookie?.();
  if (cookies?.length) res.setHeader('Set-Cookie', cookies);

  const cacheControl = response.headers.get('cache-control');
  if (cacheControl) res.setHeader('Cache-Control', cacheControl);

  return response.json().then((payload) => {
    if (!response.ok) {
      const duplicateEmail = payload.code === 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL';
      const statusCode = duplicateEmail ? 409 : response.status;
      return res.status(statusCode).json({
        error: {
          ...(payload.code ? { code: payload.code } : {}),
          message: duplicateEmail ? 'An account with this email already exists' : payload.message || 'Authentication request failed',
        },
      });
    }

    const safePayload = { ...payload };
    delete safePayload.token;
    return res.status(created ? 201 : response.status).json(safePayload);
  });
}

function handleAuthRequest(action, { created = false } = {}) {
  return async (req, res, next) => {
    try {
      const response = await action(req);
      return await forwardAuthResponse(response, res, { created });
    } catch (error) {
      return next(error);
    }
  };
}

export const register = handleAuthRequest((req) => authService.register(req.body, req.headers), { created: true });
export const login = handleAuthRequest((req) => authService.login(req.body, req.headers));
export const logout = handleAuthRequest((req) => authService.logout(req.headers));
export const forgotPassword = handleAuthRequest((req) => authService.requestPasswordReset(req.body.email, req.headers));
export const resetPassword = handleAuthRequest((req) => authService.resetPassword(req.body, req.headers));

export async function me(req, res, next) {
  try {
    const user = await authService.getCurrentUser(req.user.id);
    return res.json({ user });
  } catch (error) {
    return next(error);
  }
}

import * as authService from './auth.service.js';

function forwardAuthResponse(response, res, { created = false } = {}) {
  const cookies = response.headers.getSetCookie?.();
  if (cookies?.length) res.setHeader('Set-Cookie', cookies);

  const cacheControl = response.headers.get('cache-control');
  if (cacheControl) res.setHeader('Cache-Control', cacheControl);

  return response.json().then((payload) => {
    if (!response.ok) {
      const duplicateEmail = payload.code === 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL';
      const isInvalidToken = payload.code === 'INVALID_TOKEN' || payload.message === 'Invalid token';
      const statusCode = duplicateEmail ? 409 : response.status;
      return res.status(statusCode).json({
        error: {
          ...(payload.code ? { code: payload.code } : {}),
          message: duplicateEmail
            ? 'An account with this email already exists'
            : isInvalidToken
              ? 'This password reset link has expired or has already been used. Please request a new one.'
              : payload.message || 'Authentication request failed',
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

export async function sendVerificationCode(req, res, next) {
  try {
    const result = await authService.sendVerificationCode(req.body.email);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

export const register = handleAuthRequest((req) => authService.register(req.body, req.headers), { created: true });
export const login = handleAuthRequest((req) => authService.login(req.body, req.headers));
export async function submitSuspensionAppeal(req, res, next) {
  try {
    const appeal = await authService.submitSuspensionAppeal(req.body);
    return res.status(201).json({ data: appeal });
  } catch (error) {
    return next(error);
  }
}
export const logout = handleAuthRequest((req) => authService.logout(req.headers));
export const forgotPassword = handleAuthRequest((req) => authService.requestPasswordReset(req.body.email, req.headers));
export const resetPassword = handleAuthRequest((req) => authService.resetPassword(req.body, req.headers));

export async function verifyResetToken(req, res, next) {
  try {
    const result = await authService.verifyResetToken(req.query.token);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}


export async function me(req, res, next) {
  try {
    const user = await authService.getCurrentUser(req.user.id);
    return res.json({ user });
  } catch (error) {
    return next(error);
  }
}

export async function completeProfile(req, res, next) {
  try {
    const user = await authService.completeProfile(req.user.id, req.body);
    return res.json({ user });
  } catch (error) {
    return next(error);
  }
}

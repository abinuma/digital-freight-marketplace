import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/modules/auth/auth.service.js', () => ({
  sendVerificationCode: vi.fn(),
  register: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  requestPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
  verifyResetToken: vi.fn(),
  getCurrentUser: vi.fn(),
  completeProfile: vi.fn(),
}));

vi.mock('../../../src/shared/middleware/authenticate.js', () => ({
  authenticate: (req, res, next) => {
    req.user = {
      id: '0ecb5efc-f011-4fc9-92a8-96df1682e579',
      email: 'amina@example.com',
      role: 'SHIPPER',
      status: 'ACTIVE',
    };
    next();
  },
}));

import * as authService from '../../../src/modules/auth/auth.service.js';
import authRouter from '../../../src/modules/auth/auth.routes.js';
import { errorHandler } from '../../../src/shared/middleware/errorHandler.js';

const validRegistration = {
  name: 'Amina Hassan',
  email: 'amina@example.com',
  phone: '+251911234567',
  password: 'SecurePass1',
  role: 'SHIPPER',
  code: '123456',
};

function authResponse(payload, status = 200, headers = {}) {
  return new globalThis.Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/auth', authRouter);
  app.use(errorHandler);
  return app;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('auth endpoints', () => {
  it('sends a verification code for valid email', async () => {
    authService.sendVerificationCode.mockResolvedValue({ message: 'Verification code sent to your email' });

    const response = await request(createApp())
      .post('/auth/send-verification-code')
      .send({ email: 'amina@example.com' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Verification code sent to your email' });
    expect(authService.sendVerificationCode).toHaveBeenCalledWith('amina@example.com');
  });

  it('registers a user, returns 201, and keeps the session token in the cookie', async () => {
    authService.register.mockResolvedValue(authResponse(
      { token: 'private-session-token', user: { id: validRegistration.email, email: validRegistration.email } },
      200,
      { 'set-cookie': 'better-auth.session_token=private-session-token; HttpOnly; SameSite=Lax' },
    ));

    const response = await request(createApp()).post('/auth/register').send(validRegistration);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ user: { id: validRegistration.email, email: validRegistration.email } });
    expect(response.headers['set-cookie'][0]).toContain('HttpOnly');
    expect(response.text).not.toContain('private-session-token');
    expect(authService.register).toHaveBeenCalledWith(validRegistration, expect.objectContaining({ 'content-type': expect.any(String) }));
  });

  it('rejects invalid registration before calling the auth service', async () => {
    const response = await request(createApp()).post('/auth/register').send({ ...validRegistration, role: 'ADMIN' });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Validation failed');
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('maps Better Auth duplicate-email errors to HTTP 409', async () => {
    authService.register.mockResolvedValue(authResponse({ code: 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL', message: 'Duplicate' }, 422));

    const response = await request(createApp()).post('/auth/register').send(validRegistration);

    expect(response.status).toBe(409);
    expect(response.body.error.message).toBe('An account with this email already exists');
  });

  it('logs in and relays session cookies without returning the token in JSON', async () => {
    authService.login.mockResolvedValue(authResponse(
      { token: 'login-token', user: { id: 'user-id', email: 'amina@example.com' } },
      200,
      { 'set-cookie': 'better-auth.session_token=login-token; HttpOnly' },
    ));

    const response = await request(createApp()).post('/auth/login').send({ email: 'amina@example.com', password: 'SecurePass1' });

    expect(response.status).toBe(200);
    expect(response.body.user.id).toBe('user-id');
    expect(response.text).not.toContain('login-token');
    expect(response.headers['set-cookie'][0]).toContain('HttpOnly');
  });

  it('returns 401 for invalid login credentials', async () => {
    authService.login.mockResolvedValue(authResponse({ code: 'INVALID_EMAIL_OR_PASSWORD', message: 'Invalid credentials' }, 401));

    const response = await request(createApp()).post('/auth/login').send({ email: 'amina@example.com', password: 'WrongPass1' });

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Invalid credentials');
  });

  it('logs out an authenticated user and forwards the clearing cookie', async () => {
    authService.logout.mockResolvedValue(authResponse(
      { success: true },
      200,
      { 'set-cookie': 'better-auth.session_token=; Max-Age=0; HttpOnly' },
    ));

    const response = await request(createApp()).post('/auth/logout');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.headers['set-cookie'][0]).toContain('Max-Age=0');
  });

  it('requests a password reset and accepts a valid reset token and password', async () => {
    authService.requestPasswordReset.mockResolvedValue(authResponse({ status: true, message: 'If this email exists, check your email' }));
    authService.resetPassword.mockResolvedValue(authResponse({ status: true }));

    const app = createApp();
    const forgotResponse = await request(app).post('/auth/forgot-password').send({ email: 'amina@example.com' });
    const resetResponse = await request(app).post('/auth/reset-password').send({ token: 'reset-token', newPassword: 'NewSecurePass1' });

    expect(forgotResponse.status).toBe(200);
    expect(authService.requestPasswordReset).toHaveBeenCalledWith('amina@example.com', expect.any(Object));
    expect(resetResponse.status).toBe(200);
    expect(authService.resetPassword).toHaveBeenCalledWith({ token: 'reset-token', newPassword: 'NewSecurePass1' }, expect.any(Object));
  });

  it('verifies a reset token and maps invalid/expired token error cleanly', async () => {
    authService.verifyResetToken
      .mockResolvedValueOnce({ valid: true })
      .mockResolvedValueOnce({ valid: false, message: 'This password reset link has expired or has already been used. Please request a new one.' });

    const app = createApp();
    const validRes = await request(app).get('/auth/verify-reset-token?token=valid-token');
    expect(validRes.status).toBe(200);
    expect(validRes.body).toEqual({ valid: true });

    const expiredRes = await request(app).get('/auth/verify-reset-token?token=used-token');
    expect(expiredRes.status).toBe(200);
    expect(expiredRes.body.valid).toBe(false);
    expect(expiredRes.body.message).toContain('expired or has already been used');
  });

  it('maps Better Auth INVALID_TOKEN error to a friendly expired link message', async () => {
    authService.resetPassword.mockResolvedValue(authResponse({ code: 'INVALID_TOKEN', message: 'Invalid token' }, 400));

    const response = await request(createApp())
      .post('/auth/reset-password')
      .send({ token: 'expired-token', newPassword: 'NewSecurePass1' });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('This password reset link has expired or has already been used. Please request a new one.');
  });


  it('returns the current authenticated user', async () => {
    authService.getCurrentUser.mockResolvedValue({
      id: 'user-id',
      name: 'Amina Hassan',
      role: 'SHIPPER',
      profileComplete: true,
    });

    const response = await request(createApp()).get('/auth/me');

    expect(response.status).toBe(200);
    expect(response.body.user).toEqual({ id: 'user-id', name: 'Amina Hassan', role: 'SHIPPER', profileComplete: true });
    expect(authService.getCurrentUser).toHaveBeenCalledWith('0ecb5efc-f011-4fc9-92a8-96df1682e579');
  });

  it('completes the authenticated user profile', async () => {
    const completedUser = {
      id: 'user-id',
      phone: '+251911234567',
      role: 'SHIPPER',
      profileComplete: true,
    };
    authService.completeProfile.mockResolvedValue(completedUser);

    const response = await request(createApp())
      .post('/auth/complete-profile')
      .send({ phone: '+251911234567', role: 'SHIPPER' });

    expect(response.status).toBe(200);
    expect(response.body.user).toEqual(completedUser);
    expect(authService.completeProfile).toHaveBeenCalledWith('0ecb5efc-f011-4fc9-92a8-96df1682e579', {
      phone: '+251911234567',
      role: 'SHIPPER',
    });
  });

  it('rejects an invalid phone number during profile completion', async () => {
    const response = await request(createApp())
      .post('/auth/complete-profile')
      .send({ phone: '123', role: 'SHIPPER' });

    expect(response.status).toBe(400);
    expect(authService.completeProfile).not.toHaveBeenCalled();
  });
});

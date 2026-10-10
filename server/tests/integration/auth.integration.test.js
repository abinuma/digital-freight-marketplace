import 'dotenv/config';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import request from 'supertest';

vi.mock('../../src/modules/shipment/shipment.storage.js', () => ({
  uploadShipmentImage: vi.fn(),
  deleteShipmentImage: vi.fn(),
  deleteUploadedImages: vi.fn(),
}));

const testDatabaseUrl = process.env.AUTH_INTEGRATION_DATABASE_URL;
const runIntegrationTests = Boolean(testDatabaseUrl && process.env.AUTH_INTEGRATION_TESTS === '1');
if (runIntegrationTests) {
  process.env.DATABASE_URL = testDatabaseUrl;
  process.env.NODE_ENV = 'development';
}

let auth;
let prisma;
let logger;
let app;
let testEmail;
let incompleteEmail;
const resetIdentifiers = new Set();

function sessionCookie(response) {
  const cookie = response.headers.get('set-cookie')?.match(/better-auth\.session_token=[^;,]+/)?.[0];
  expect(cookie, 'expected Better Auth to set a session cookie').toBeTruthy();
  return cookie;
}

function resetTokenFromLoggedLink() {
  const call = vi.mocked(logger.warn).mock.calls.find(([fields]) => fields?.email === testEmail && fields?.resetUrl);
  expect(call, 'expected the development reset callback to log the reset link').toBeTruthy();
  const token = new globalThis.URL(call[0].resetUrl).pathname.split('/').at(-1);
  resetIdentifiers.add(`reset-password:${token}`);
  return token;
}

describe.skipIf(!runIntegrationTests)('Better Auth with the dedicated integration database', () => {
  beforeAll(async () => {
    vi.resetModules();
    [{ auth }, { prisma }, { logger }, { app }] = await Promise.all([
      import('../../src/shared/auth/index.js'),
      import('../../src/shared/db/prisma.js'),
      import('../../src/shared/utils/logger.js'),
      import('../../src/app.js'),
    ]);
    testEmail = `auth-integration-${randomUUID()}@example.invalid`;
    incompleteEmail = `auth-incomplete-${randomUUID()}@example.invalid`;
  });

  afterAll(async () => {
    if (prisma && testEmail) {
      const user = await prisma.user.findUnique({ where: { email: testEmail }, select: { id: true } });
      if (user) {
        await prisma.verification.deleteMany({
          where: { identifier: { startsWith: 'reset-password:' }, value: user.id },
        });
      }
      await prisma.user.deleteMany({ where: { email: { in: [testEmail, incompleteEmail] } } });
      if (resetIdentifiers.size) {
        await prisma.verification.deleteMany({ where: { identifier: { in: [...resetIdentifiers] } } });
      }
      await prisma.$disconnect();
    }
  });

  it('registers, authenticates, logs out, resets a password, and authenticates with the new password', async () => {
    const initialPassword = 'ValidPass123';
    const newPassword = 'UpdatedPass456';
    const registration = await auth.api.signUpEmail({
      body: {
        name: 'Auth Integration Test',
        email: testEmail,
        phone: '+251911234567',
        password: initialPassword,
        role: 'SHIPPER',
      },
      asResponse: true,
    });

    expect(registration.status).toBe(200);
    const registrationBody = await registration.json();
    expect(registrationBody.user.email).toBe(testEmail);
    const user = await prisma.user.findUnique({ where: { email: testEmail }, include: { accounts: true, sessions: true } });
    expect(user).toMatchObject({ role: 'SHIPPER', status: 'ACTIVE' });
    expect(user.accounts.some((account) => account.providerId === 'credential' && account.password)).toBe(true);
    expect(user.sessions.length).toBeGreaterThan(0);

    const cookie = sessionCookie(registration);
    expect((await auth.api.getSession({ headers: new globalThis.Headers({ cookie }) })).user.email).toBe(testEmail);

    const invalidLogin = await auth.api.signInEmail({
      body: { email: testEmail, password: 'WrongPass123' },
      asResponse: true,
    });
    expect(invalidLogin.status).toBe(401);

    const login = await auth.api.signInEmail({ body: { email: testEmail, password: initialPassword }, asResponse: true });
    expect(login.status).toBe(200);
    const loginCookie = sessionCookie(login);

    const logout = await auth.api.signOut({ headers: new globalThis.Headers({ cookie: loginCookie }), asResponse: true });
    expect(logout.status).toBe(200);
    expect(await auth.api.getSession({ headers: new globalThis.Headers({ cookie: loginCookie }) })).toBeNull();

    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => logger);
    let resetToken;
    try {
      const resetRequest = await auth.api.requestPasswordReset({
        body: { email: testEmail, redirectTo: 'http://localhost:3000/reset-password' },
        asResponse: true,
      });
      expect(resetRequest.status).toBe(200);
      resetToken = resetTokenFromLoggedLink();
    } finally {
      warnSpy.mockRestore();
    }

    const reset = await auth.api.resetPassword({
      body: { token: resetToken, newPassword },
      asResponse: true,
    });
    expect(reset.status).toBe(200);

    const oldPasswordLogin = await auth.api.signInEmail({
      body: { email: testEmail, password: initialPassword },
      asResponse: true,
    });
    expect(oldPasswordLogin.status).toBe(401);
    const newPasswordLogin = await auth.api.signInEmail({ body: { email: testEmail, password: newPassword }, asResponse: true });
    expect(newPasswordLogin.status).toBe(200);
    sessionCookie(newPasswordLogin);

    await prisma.user.update({ where: { email: testEmail }, data: { status: 'SUSPENDED' } });
    const suspendedLogin = await auth.api.signInEmail({ body: { email: testEmail, password: newPassword }, asResponse: true });
    expect(suspendedLogin.status).toBe(403);
    expect((await suspendedLogin.json()).message).toContain('suspended');
  }, 60_000);

  it('builds the Google authorization redirect with the Better Auth callback URL', async () => {
    const previousVerificationIds = new Set((await prisma.verification.findMany({ select: { id: true } })).map(({ id }) => id));

    try {
      const response = await auth.api.signInSocial({
        body: { provider: 'google', callbackURL: 'http://localhost:3000/auth/callback' },
        asResponse: true,
      });
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.redirect).toBe(true);

      const authorizationUrl = new globalThis.URL(body.url);
      expect(authorizationUrl.hostname).toBe('accounts.google.com');
      expect(authorizationUrl.searchParams.get('client_id')).toBe(process.env.GOOGLE_CLIENT_ID);
      expect(authorizationUrl.searchParams.get('redirect_uri')).toBe(`${process.env.BETTER_AUTH_URL}/api/auth/callback/google`);
    } finally {
      const currentVerifications = await prisma.verification.findMany({ select: { id: true } });
      const createdVerificationIds = currentVerifications
        .map(({ id }) => id)
        .filter((id) => !previousVerificationIds.has(id));
      if (createdVerificationIds.length) {
        await prisma.verification.deleteMany({ where: { id: { in: createdVerificationIds } } });
      }
    }
  });

  it('lets an authenticated user complete a missing phone and role before accessing marketplace routes', async () => {
    const registration = await auth.api.signUpEmail({
      body: {
        name: 'Incomplete OAuth Profile Test',
        email: incompleteEmail,
        password: 'ValidPass123',
      },
      asResponse: true,
    });
    expect(registration.status).toBe(200);

    const body = await registration.json();
    const cookie = sessionCookie(registration);
    const incompleteUser = await prisma.user.findUnique({ where: { email: incompleteEmail } });
    expect(incompleteUser).toMatchObject({ phone: null, role: null });

    const meBeforeCompletion = await request(app).get('/api/v1/auth/me').set('Cookie', cookie);
    expect(meBeforeCompletion.status).toBe(200);
    expect(meBeforeCompletion.body.user.profileComplete).toBe(false);

    const blockedMarketplaceRequest = await request(app)
      .get(`/api/v1/users/${body.user.id}`)
      .set('Cookie', cookie);
    expect(blockedMarketplaceRequest.status).toBe(403);
    expect(blockedMarketplaceRequest.body.error.details.code).toBe('PROFILE_INCOMPLETE');

    const completion = await request(app)
      .post('/api/v1/auth/complete-profile')
      .set('Cookie', cookie)
      .send({ phone: '+251911234568', role: 'TRANSPORTER' });
    expect(completion.status).toBe(200);
    expect(completion.body.user).toMatchObject({ phone: '+251911234568', role: 'TRANSPORTER', profileComplete: true });

    const completedUser = await prisma.user.findUnique({ where: { email: incompleteEmail } });
    expect(completedUser).toMatchObject({ phone: '+251911234568', role: 'TRANSPORTER' });
    const marketplaceRequest = await request(app).get(`/api/v1/users/${body.user.id}`).set('Cookie', cookie);
    expect(marketplaceRequest.status).toBe(200);
  }, 60_000);
});

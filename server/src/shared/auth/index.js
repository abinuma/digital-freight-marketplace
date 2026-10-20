import 'dotenv/config';
import { betterAuth } from 'better-auth';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { prismaAdapter } from '@better-auth/prisma-adapter';
import { z } from 'zod';
import { config } from '../config/index.js';
import { prisma } from '../db/prisma.js';
import { authSessionOptions } from './session.config.js';
import * as notificationService from '../../modules/notification/notification.service.js';
import { ethiopianPhoneSchema } from '../utils/ethiopianPhone.js';

const requiredEnv = ['BETTER_AUTH_SECRET', 'BETTER_AUTH_URL', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];
const missingEnv = requiredEnv.filter((name) => !process.env[name]);

if (missingEnv.length > 0) {
  throw new Error(`Missing Better Auth environment variables: ${missingEnv.join(', ')}`);
}

const phoneSchema = ethiopianPhoneSchema;
const roleSchema = z.enum(['SHIPPER', 'TRANSPORTER']);
const passwordSchema = z
  .string()
  .min(8)
  .max(128)
  .regex(/[A-Z]/, 'Password must include an uppercase letter')
  .regex(/[a-z]/, 'Password must include a lowercase letter')
  .regex(/[0-9]/, 'Password must include a digit');
const allowedRoles = new Set(['SHIPPER', 'TRANSPORTER']);

export const auth = betterAuth({
  appName: 'Digital Freight Marketplace',
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [config.CORS_ORIGIN],
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  rateLimit: {
    enabled: true,
    customRules: {
      '/sign-up/email': { window: 15 * 60, max: 10 },
      '/sign-in/email': { window: 15 * 60, max: 10 },
      '/request-password-reset': { window: 15 * 60, max: 3 },
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    sendResetPassword: async ({ user, url }) => notificationService.passwordReset(user, url),
  },
  hooks: {
    before: createAuthMiddleware(async (context) => {
      if (context.path === '/sign-in/email' && typeof context.body?.email === 'string') {
        const account = await prisma.user.findUnique({
          where: { email: context.body.email.toLowerCase() },
          select: { status: true },
        });
        if (account?.status === 'SUSPENDED') {
          throw new APIError('FORBIDDEN', { message: 'This account has been suspended' });
        }
      }

      const passwordField =
        context.path === '/sign-up/email'
          ? 'password'
          : context.path === '/reset-password'
            ? 'newPassword'
            : null;
      if (!passwordField) return;

      const parsed = passwordSchema.safeParse(context.body?.[passwordField]);
      if (!parsed.success) {
        throw new APIError('BAD_REQUEST', {
          message: 'Password must be at least 8 characters and include uppercase and lowercase letters and a digit.',
        });
      }
    }),
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },
  user: {
    additionalFields: {
      phone: {
        type: 'string',
        required: false,
        input: true,
        validator: { input: phoneSchema },
      },
      role: {
        type: ['SHIPPER', 'TRANSPORTER'],
        required: false,
        input: true,
        validator: { input: roleSchema },
      },
      status: {
        type: ['ACTIVE', 'SUSPENDED'],
        required: true,
        input: false,
        defaultValue: 'ACTIVE',
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (user.phone == null && user.role == null) {
            return { data: { ...user, phone: null, role: null } };
          }

          const phone = phoneSchema.safeParse(user.phone);
          const role = roleSchema.safeParse(user.role);
          if (!phone.success || !role.success || !allowedRoles.has(user.role)) return false;

          return { data: { ...user, phone: phone.data, role: role.data, emailVerified: true } };
        },
        after: async (user) => notificationService.welcome(user),
      },
    },
  },
  session: authSessionOptions,
  advanced: {
    database: { generateId: 'uuid' },
    useSecureCookies: process.env.NODE_ENV === 'production',
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  },
});

export default auth;

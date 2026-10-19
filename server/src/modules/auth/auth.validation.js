import { z } from 'zod';
import { ethiopianPhoneSchema } from '../../shared/utils/ethiopianPhone.js';

const emailSchema = z.string().trim().email().max(255).transform((email) => email.toLowerCase());
const phoneSchema = ethiopianPhoneSchema;
const roleSchema = z.enum(['SHIPPER', 'TRANSPORTER']);
const passwordSchema = z
  .string()
  .min(8)
  .max(128)
  .regex(/[A-Z]/, 'Password must include an uppercase letter')
  .regex(/[a-z]/, 'Password must include a lowercase letter')
  .regex(/[0-9]/, 'Password must include a digit');

export const registerSchema = {
  body: z.object({
    name: z.string().trim().min(1).max(100),
    email: emailSchema,
    phone: phoneSchema,
    password: passwordSchema,
    role: z.enum(['SHIPPER', 'TRANSPORTER']),
  }),
};

export const loginSchema = {
  body: z.object({
    email: emailSchema,
    password: z.string().min(1).max(128),
  }),
};

export const forgotPasswordSchema = {
  body: z.object({ email: emailSchema }),
};

export const resetPasswordSchema = {
  body: z.object({
    token: z.string().min(1),
    newPassword: passwordSchema,
  }),
};

export const completeProfileSchema = {
  body: z.object({
    phone: phoneSchema,
    role: roleSchema,
  }),
};

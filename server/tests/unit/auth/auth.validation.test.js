import { describe, expect, it } from 'vitest';
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema, sendVerificationCodeSchema } from '../../../src/modules/auth/auth.validation.js';

const registration = {
  name: 'Amina Hassan',
  email: ' AMINA@example.com ',
  phone: '+251911234567',
  password: 'SecurePass1',
  role: 'SHIPPER',
  code: '123456',
};

describe('auth request validation', () => {
  it('validates registration fields and normalizes email', () => {
    expect(registerSchema.body.parse(registration)).toEqual({ ...registration, email: 'amina@example.com' });
  });

  it('rejects an ADMIN role and passwords without all required character classes', () => {
    expect(registerSchema.body.safeParse({ ...registration, role: 'ADMIN' }).success).toBe(false);
    expect(registerSchema.body.safeParse({ ...registration, password: 'securepass1' }).success).toBe(false);
    expect(registerSchema.body.safeParse({ ...registration, password: 'SecurePass' }).success).toBe(false);
  });

  it('validates verification code format on registration', () => {
    expect(registerSchema.body.safeParse({ ...registration, code: '12345' }).success).toBe(false);
    expect(registerSchema.body.safeParse({ ...registration, code: 'abcdef' }).success).toBe(false);
    expect(registerSchema.body.safeParse({ ...registration, code: '' }).success).toBe(false);
  });

  it('validates sendVerificationCode input', () => {
    expect(sendVerificationCodeSchema.body.safeParse({ email: 'user@example.com' }).success).toBe(true);
    expect(sendVerificationCodeSchema.body.safeParse({ email: 'invalid' }).success).toBe(false);
  });

  it('requires a valid email and non-empty password for login', () => {
    expect(loginSchema.body.safeParse({ email: 'user@example.com', password: 'x' }).success).toBe(true);
    expect(loginSchema.body.safeParse({ email: 'invalid', password: 'x' }).success).toBe(false);
    expect(loginSchema.body.safeParse({ email: 'user@example.com', password: '' }).success).toBe(false);
  });

  it('validates forgot-password email input', () => {
    expect(forgotPasswordSchema.body.safeParse({ email: 'user@example.com' }).success).toBe(true);
    expect(forgotPasswordSchema.body.safeParse({ email: 'invalid' }).success).toBe(false);
  });

  it('requires a reset token and a password that meets the security rules', () => {
    expect(resetPasswordSchema.body.safeParse({ token: 'reset-token', newPassword: 'SecurePass1' }).success).toBe(true);
    expect(resetPasswordSchema.body.safeParse({ token: '', newPassword: 'SecurePass1' }).success).toBe(false);
    expect(resetPasswordSchema.body.safeParse({ token: 'reset-token', newPassword: 'weakpass' }).success).toBe(false);
  });
});

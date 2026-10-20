import { fromNodeHeaders } from 'better-auth/node';
import { config } from '../../shared/config/index.js';
import { auth } from '../../shared/auth/index.js';
import { AppError } from '../../shared/utils/AppError.js';
import { logger } from '../../shared/utils/logger.js';
import {
  completeUserProfile as completeUserProfileRecord,
  deleteEmailVerificationRecord,
  findAuthUserByEmail,
  findAuthUserById,
  findPasswordResetToken,
  getEmailVerificationRecord,
  saveEmailVerificationCode,
} from './auth.repository.js';
import { sendVerificationCodeEmail, takePasswordResetDelivery } from '../notification/notification.service.js';

export async function sendVerificationCode(email) {
  const existingUser = await findAuthUserByEmail(email);
  if (existingUser) {
    throw new AppError('An account with this email already exists', 409);
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await saveEmailVerificationCode(email, code, expiresAt);
  logger.info({ email, code }, 'Registration verification code generated');

  const delivery = await sendVerificationCodeEmail(email, code);
  if (!delivery?.sent && delivery?.reason === 'delivery_failed') {
    throw new AppError('We couldn’t send the verification email right now. Please try again later.', 503);
  }

  return { message: 'Verification code sent to your email' };
}

export async function register(input, headers) {
  const { code, ...userData } = input;

  const existingUser = await findAuthUserByEmail(userData.email);
  if (existingUser) {
    throw new AppError('An account with this email already exists', 409);
  }

  const record = await getEmailVerificationRecord(userData.email);
  if (!record || record.value !== code) {
    throw new AppError('Invalid verification code. Please check your email and try again.', 400);
  }

  if (new Date() > new Date(record.expiresAt)) {
    await deleteEmailVerificationRecord(userData.email);
    throw new AppError('Verification code has expired. Please request a new code.', 400);
  }

  await deleteEmailVerificationRecord(userData.email);

  return auth.api.signUpEmail({ body: userData, headers: fromNodeHeaders(headers), asResponse: true });
}

export async function login(input, headers) {
  const user = await findAuthUserByEmail(input.email);
  if (!user) throw new AppError("We couldn't find your account. Please register first.", 404);

  return auth.api.signInEmail({ body: input, headers: fromNodeHeaders(headers), asResponse: true });
}

export function logout(headers) {
  return auth.api.signOut({ headers: fromNodeHeaders(headers), asResponse: true });
}

export async function requestPasswordReset(email, headers) {
  const user = await findAuthUserByEmail(email);
  if (!user) throw new AppError('No account was found with this email address.', 404);

  const response = await auth.api.requestPasswordReset({
    body: { email, redirectTo: `${config.CORS_ORIGIN}/reset-password` },
    headers: fromNodeHeaders(headers),
    asResponse: true,
  });
  const delivery = takePasswordResetDelivery(email);
  if (!response.ok || !delivery?.sent) {
    throw new AppError('We couldn’t send the reset email right now. Please try again later.', 503);
  }
  return response;
}

export function resetPassword(input, headers) {
  return auth.api.resetPassword({ body: input, headers: fromNodeHeaders(headers), asResponse: true });
}

export async function verifyResetToken(token) {
  if (!token) {
    return {
      valid: false,
      message: 'This reset link is missing its token. Request a new password reset link.',
    };
  }
  const record = await findPasswordResetToken(token);
  if (!record) {
    return {
      valid: false,
      message: 'This password reset link has expired or has already been used. Please request a new one.',
    };
  }
  return { valid: true };
}


export async function completeProfile(userId, input) {
  const result = await completeUserProfileRecord(userId, input);
  if (!result) throw new AppError('User account was not found', 404);
  if (result.alreadyComplete) throw new AppError('Profile is already complete', 409);
  if (result.conflict) throw new AppError('Profile changed while being completed; reload and try again', 409);

  const { image, ...profile } = result.user;
  return { ...profile, profilePhoto: image, profileComplete: true };
}

export async function getCurrentUser(id) {
  const user = await findAuthUserById(id);
  if (!user) throw new AppError('User account was not found', 404);

  const { image, ...profile } = user;
  return {
    ...profile,
    profilePhoto: image,
    profileComplete: Boolean(profile.phone && profile.role),
  };
}

import { fromNodeHeaders } from 'better-auth/node';
import { config } from '../../shared/config/index.js';
import { auth } from '../../shared/auth/index.js';
import { AppError } from '../../shared/utils/AppError.js';
import { completeUserProfile as completeUserProfileRecord, findAuthUserByEmail, findAuthUserById } from './auth.repository.js';
import { takePasswordResetDelivery } from '../notification/notification.service.js';

export function register(input, headers) {
  return auth.api.signUpEmail({ body: input, headers: fromNodeHeaders(headers), asResponse: true });
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

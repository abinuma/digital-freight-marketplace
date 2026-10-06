import { fromNodeHeaders } from 'better-auth/node';
import { config } from '../../shared/config/index.js';
import { auth } from '../../shared/auth/index.js';
import { AppError } from '../../shared/utils/AppError.js';
import { completeUserProfile as completeUserProfileRecord, findAuthUserById } from './auth.repository.js';

export function register(input, headers) {
  return auth.api.signUpEmail({ body: input, headers: fromNodeHeaders(headers), asResponse: true });
}

export function login(input, headers) {
  return auth.api.signInEmail({ body: input, headers: fromNodeHeaders(headers), asResponse: true });
}

export function logout(headers) {
  return auth.api.signOut({ headers: fromNodeHeaders(headers), asResponse: true });
}

export function requestPasswordReset(email, headers) {
  return auth.api.requestPasswordReset({
    body: { email, redirectTo: `${config.CORS_ORIGIN}/reset-password` },
    headers: fromNodeHeaders(headers),
    asResponse: true,
  });
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

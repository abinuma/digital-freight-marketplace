import { AppError } from '../utils/AppError.js';

export function requireProfileComplete(req, res, next) {
  if (!req.user) return next(new AppError('Authentication required', 401));
  if (!req.user.profileComplete) {
    return next(new AppError('Complete your profile before using marketplace features', 403, { code: 'PROFILE_INCOMPLETE' }));
  }

  return next();
}

export default requireProfileComplete;

import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../auth/index.js';
import { AppError } from '../utils/AppError.js';

export async function authenticate(req, res, next) {
  try {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });

    if (!session?.user) return next(new AppError('Authentication required', 401));
    if (session.user.status !== 'ACTIVE') return next(new AppError('Account is suspended', 403));

    req.user = {
      id: session.user.id,
      email: session.user.email,
      phone: session.user.phone,
      role: session.user.role,
      status: session.user.status,
      profileComplete: Boolean(session.user.phone && session.user.role),
    };

    return next();
  } catch (error) {
    return next(error);
  }
}

export default authenticate;

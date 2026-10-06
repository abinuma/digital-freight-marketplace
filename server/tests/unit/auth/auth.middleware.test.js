import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/shared/auth/index.js', () => ({
  auth: { api: { getSession: vi.fn() } },
}));

import { auth } from '../../../src/shared/auth/index.js';
import { authenticate } from '../../../src/shared/middleware/authenticate.js';
import { authorize } from '../../../src/shared/middleware/authorize.js';

beforeEach(() => vi.clearAllMocks());

describe('authentication middleware', () => {
  it('attaches the active user from the Better Auth session', async () => {
    auth.api.getSession.mockResolvedValue({
      user: { id: 'user-id', email: 'user@example.com', role: 'TRANSPORTER', status: 'ACTIVE' },
    });
    const req = { headers: { cookie: 'session=test' } };
    const next = vi.fn();

    await authenticate(req, {}, next);

    expect(req.user).toEqual({ id: 'user-id', email: 'user@example.com', role: 'TRANSPORTER', status: 'ACTIVE' });
    expect(next).toHaveBeenCalledWith();
  });

  it('returns 401 when the request has no valid session', async () => {
    auth.api.getSession.mockResolvedValue(null);
    const next = vi.fn();

    await authenticate({ headers: {} }, {}, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('rejects suspended accounts', async () => {
    auth.api.getSession.mockResolvedValue({
      user: { id: 'user-id', email: 'user@example.com', role: 'SHIPPER', status: 'SUSPENDED' },
    });
    const next = vi.fn();

    await authenticate({ headers: { cookie: 'session=test' } }, {}, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403, message: 'Account is suspended' }));
  });
});

describe('role authorization middleware', () => {
  it('allows a user with an allowed role', () => {
    const next = vi.fn();

    authorize(['SHIPPER', 'TRANSPORTER'])({ user: { role: 'TRANSPORTER' } }, {}, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('returns 403 when the user role is not allowed', () => {
    const next = vi.fn();

    authorize('ADMIN')({ user: { role: 'SHIPPER' } }, {}, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  it('returns 401 when no authenticated user is present', () => {
    const next = vi.fn();

    authorize('ADMIN')({}, {}, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });
});

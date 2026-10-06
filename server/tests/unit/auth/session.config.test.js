import { describe, expect, it } from 'vitest';
import { authSessionOptions } from '../../../src/shared/auth/session.config.js';

describe('Better Auth session options', () => {
  it('refreshes active sessions hourly and expires inactive sessions after 24 hours', () => {
    expect(authSessionOptions).toEqual({
      expiresIn: 24 * 60 * 60,
      updateAge: 60 * 60,
    });
  });
});

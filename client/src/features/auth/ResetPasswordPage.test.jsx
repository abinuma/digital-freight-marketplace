import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./auth.api.js', () => ({
  resetPassword: vi.fn(),
  verifyResetToken: vi.fn().mockResolvedValue({ valid: true }),
}));

import { ResetPasswordPage } from './ResetPasswordPage.jsx';

describe('ResetPasswordPage', () => {
  it('renders expired link state when error=INVALID_TOKEN is present in URL', () => {
    const markup = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        { initialEntries: ['/reset-password?error=INVALID_TOKEN'] },
        createElement(ResetPasswordPage),
      ),
    );

    expect(markup).toContain('Link expired');
    expect(markup).toContain('This password reset link has expired or has already been used.');
    expect(markup).toContain('Request a new reset link');
    expect(markup).not.toContain('Update Password');
  });

  it('renders expired link state when token is missing', () => {
    const markup = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        { initialEntries: ['/reset-password'] },
        createElement(ResetPasswordPage),
      ),
    );

    expect(markup).toContain('Link expired');
    expect(markup).toContain('Request a new reset link');
    expect(markup).not.toContain('Update Password');
  });

  it('renders verifying state initially when token is present without error param', () => {
    const markup = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        { initialEntries: ['/reset-password?token=valid-token-123'] },
        createElement(ResetPasswordPage),
      ),
    );

    expect(markup).toContain('Verifying link…');
  });
});

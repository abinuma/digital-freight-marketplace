import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PasswordRulesList } from './PasswordRulesList.jsx';

describe('PasswordRulesList', () => {
  it('renders all 4 rules vertically and marks all as not met for empty password', () => {
    const markup = renderToStaticMarkup(createElement(PasswordRulesList, { password: '' }));

    expect(markup).toContain('At least 8 characters');
    expect(markup).toContain('At least one uppercase letter (A-Z)');
    expect(markup).toContain('At least one lowercase letter (a-z)');
    expect(markup).toContain('At least one number (0-9)');
    expect(markup).not.toContain('bg-emerald-100');
  });

  it('marks each rule green when its criteria is met', () => {
    // Only uppercase and lowercase
    const partialMarkup = renderToStaticMarkup(createElement(PasswordRulesList, { password: 'Abc' }));
    expect(partialMarkup).toContain('bg-emerald-100');

    // Fully valid password: min 8 chars, uppercase, lowercase, number
    const validMarkup = renderToStaticMarkup(createElement(PasswordRulesList, { password: 'Password123' }));
    // All 4 criteria met should have 4 instances of bg-emerald-100
    const matches = validMarkup.match(/bg-emerald-100/g) || [];
    expect(matches.length).toBe(4);
  });
});

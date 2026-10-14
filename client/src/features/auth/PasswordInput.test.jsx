import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PasswordInput } from './PasswordInput.jsx';

describe('PasswordInput', () => {
  it('renders password input and uses eye-solid-full.svg for toggle', () => {
    const markup = renderToStaticMarkup(
      createElement(PasswordInput, {
        id: 'test-pass',
        name: 'password',
        value: 'secret123',
        onChange: () => {},
      })
    );

    expect(markup).toContain('type="password"');
    expect(markup).toContain('src="/eye-solid-full.svg"');
    expect(markup).toContain('aria-label="Show password"');
  });
});

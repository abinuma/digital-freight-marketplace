import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Button } from './Button.jsx'
import { AuthField } from '../../features/auth/AuthField.jsx'

describe('shared UI components', () => {
  it('renders a button with its variant, size, type, and accessible label', () => {
    const markup = renderToStaticMarkup(createElement(Button, {
      variant: 'secondary',
      size: 'sm',
      type: 'submit',
      children: 'Save changes',
    }))

    expect(markup).toContain('ui-button--secondary')
    expect(markup).toContain('ui-button--sm')
    expect(markup).toContain('type="submit"')
    expect(markup).toContain('Save changes')
  })

  it('connects a field label and exposes its validation error', () => {
    const markup = renderToStaticMarkup(createElement(AuthField, {
      id: 'email',
      label: 'Email address',
      error: 'Enter a valid email address',
      children: createElement('input', { id: 'email', name: 'email' }),
    }))

    expect(markup).toContain('for="email"')
    expect(markup).toContain('Email address')
    expect(markup).toContain('role="alert"')
    expect(markup).toContain('id="email-error"')
  })
})

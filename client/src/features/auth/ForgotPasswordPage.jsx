import { useState } from 'react';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Button, Input } from '../../shared/components/index.js';
import { requestPasswordReset } from './auth.api.js';
import { AuthField } from './AuthField.jsx';
import { AuthPageLayout } from './AuthPageLayout.jsx';

const emailSchema = z.string().trim().email('Enter a valid email address').max(255);

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message || 'Enter a valid email address');
      return;
    }

    setFieldError('');
    setIsSubmitting(true);
    try {
      await requestPasswordReset(parsed.data.toLowerCase());
      setIsSubmitted(true);
    } catch (error) {
      setFormError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthPageLayout
      title={isSubmitted ? 'Check your email' : 'Forgot Password?'}
      subtitle={isSubmitted ? 'If an account matches that email, we’ll send a reset link.' : 'Enter your email and we’ll send you a link to reset your password.'}
      icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="8" cy="15" r="4" /><path d="m10.85 12.15 8.15-8.15 2 2-2 2 2 2-2 2-2-2-5.3 5.3" /></svg>}
      footer={<Link to="/login">← Back to Login</Link>}
    >
      {isSubmitted ? (
        <div className="auth-success" role="status">
          <p>Check your inbox for instructions to reset your password. The link may take a few minutes to arrive.</p>
          <Button variant="secondary" onClick={() => setIsSubmitted(false)}>Try another email</Button>
        </div>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <AuthField id="email" label="Email Address" error={fieldError}>
            <Input id="email" type="email" autoComplete="email" placeholder="abebe@example.com" value={email} onChange={(event) => { setEmail(event.target.value); setFieldError(''); }} required aria-invalid={Boolean(fieldError)} aria-describedby={fieldError ? 'email-error' : undefined} />
          </AuthField>
          {formError && <p className="auth-form__error" role="alert">{formError}</p>}
          <Button type="submit" className="auth-submit" disabled={isSubmitting}>{isSubmitting ? 'Sending…' : 'Send Reset Link'}</Button>
        </form>
      )}
    </AuthPageLayout>
  );
}

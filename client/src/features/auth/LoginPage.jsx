import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Input } from '../../shared/components/index.js';
import { useAuth } from './AuthContext.jsx';
import { AuthField } from './AuthField.jsx';
import { AuthPageLayout } from './AuthPageLayout.jsx';
import { GoogleSignInButton } from './GoogleSignInButton.jsx';
import { errorsFromIssues, loginSchema } from './auth.schemas.js';
import { PasswordInput } from './PasswordInput.jsx';

const roleHome = { SHIPPER: '/shipper', TRANSPORTER: '/transporter', ADMIN: '/admin' };

function destinationFor(user, requestedPath) {
  if (!user.profileComplete) return '/complete-profile';
  if (requestedPath === '/profile') return requestedPath;
  const rolePath = roleHome[user.role] || '/';
  return requestedPath?.startsWith(rolePath) ? requestedPath : rolePath;
}

export function LoginPage() {
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    const parsed = loginSchema.safeParse(form);
    if (!parsed.success) {
      setFieldErrors(errorsFromIssues(parsed.error.issues));
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    try {
      const user = await login({ ...parsed.data, email: parsed.data.email.toLowerCase() });
      navigate(destinationFor(user, location.state?.from?.pathname), { replace: true });
    } catch (error) {
      setFormError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthPageLayout
      title="Welcome Back"
      subtitle="Please enter your details to sign in"
      footer={<>Don’t have an account? <Link to="/register">Sign up for free</Link></>}
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <AuthField id="email" label="Email Address" error={fieldErrors.email}>
          <Input id="email" name="email" type="email" autoComplete="email" placeholder="abebe@example.com" value={form.email} onChange={updateField} required aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? 'email-error' : undefined} />
        </AuthField>
        <AuthField id="password" label="Password" error={fieldErrors.password}>
          <PasswordInput id="password" name="password" value={form.password} onChange={updateField} autoComplete="current-password" error={fieldErrors.password} />
        </AuthField>
        <div className="auth-form__aside"><Link to="/forgot-password">Forgot password?</Link></div>
        {formError && <p className="auth-form__error" role="alert">{formError}</p>}
        <Button type="submit" className="auth-submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign In'}
        </Button>
      </form>
      <div className="auth-divider"><span>or</span></div>
      <GoogleSignInButton />
    </AuthPageLayout>
  );
}

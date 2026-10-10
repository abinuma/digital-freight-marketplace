import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input } from '../../shared/components/index.js';
import { useAuth } from './AuthContext.jsx';
import { AuthField } from './AuthField.jsx';
import { AuthPageLayout } from './AuthPageLayout.jsx';
import { GoogleSignInButton } from './GoogleSignInButton.jsx';
import { errorsFromIssues, registrationSchema } from './auth.schemas.js';
import { PasswordInput } from './PasswordInput.jsx';

const initialForm = {
  firstName: '',
  lastName: '',
  role: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
};

const roles = [
  { value: 'SHIPPER', title: 'Shipper', detail: 'I need to move goods', symbol: '▣' },
  { value: 'TRANSPORTER', title: 'Transporter', detail: 'I own or drive trucks', symbol: '▰' },
];

export function RegistrationPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
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
    const parsed = registrationSchema.safeParse(form);
    if (!parsed.success) {
      setFieldErrors(errorsFromIssues(parsed.error.issues));
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    try {
      const { firstName, lastName, email, phone, password, role } = parsed.data;
      const user = await register({
        name: `${firstName} ${lastName}`.trim(),
        email: email.toLowerCase(),
        phone,
        password,
        role,
      });
      navigate(user.profileComplete ? `/${user.role.toLowerCase()}` : '/complete-profile', { replace: true });
    } catch (error) {
      setFormError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthPageLayout
      title="Create Your Account"
      subtitle="Join Ethiopia’s freight network"
      footer={<>Already have an account? <Link to="/login">Sign in</Link></>}
    >
      <form className="auth-form auth-form--registration" onSubmit={handleSubmit} noValidate>
        <div className="auth-form__grid auth-form__grid--two">
          <AuthField id="firstName" label="First Name" error={fieldErrors.firstName}>
            <Input id="firstName" name="firstName" autoComplete="given-name" placeholder="Abebe" value={form.firstName} onChange={updateField} required aria-invalid={Boolean(fieldErrors.firstName)} aria-describedby={fieldErrors.firstName ? 'firstName-error' : undefined} />
          </AuthField>
          <AuthField id="lastName" label="Last Name" error={fieldErrors.lastName}>
            <Input id="lastName" name="lastName" autoComplete="family-name" placeholder="Kebede" value={form.lastName} onChange={updateField} required aria-invalid={Boolean(fieldErrors.lastName)} aria-describedby={fieldErrors.lastName ? 'lastName-error' : undefined} />
          </AuthField>
        </div>

        <fieldset className="role-choice">
          <legend>I am a:</legend>
          <div className="role-choice__grid">
            {roles.map((role) => (
              <label key={role.value} className={`role-choice__option${form.role === role.value ? ' is-selected' : ''}`}>
                <input type="radio" name="role" value={role.value} checked={form.role === role.value} onChange={updateField} aria-invalid={Boolean(fieldErrors.role)} />
                <span className="role-choice__symbol" aria-hidden="true">{role.symbol}</span>
                <span className="role-choice__title">{role.title}</span>
                <span className="role-choice__detail">{role.detail}</span>
              </label>
            ))}
          </div>
          {fieldErrors.role && <p className="auth-field__error" role="alert">{fieldErrors.role}</p>}
        </fieldset>

        <AuthField id="email" label="Email Address" error={fieldErrors.email}>
          <Input id="email" name="email" type="email" autoComplete="email" placeholder="abebe@example.com" value={form.email} onChange={updateField} required aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? 'email-error' : undefined} />
        </AuthField>
        <AuthField id="phone" label="Phone Number" error={fieldErrors.phone}>
          <Input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="+251 912 345 678" value={form.phone} onChange={updateField} required aria-invalid={Boolean(fieldErrors.phone)} aria-describedby={fieldErrors.phone ? 'phone-error' : undefined} />
        </AuthField>
        <div className="auth-form__grid auth-form__grid--two">
          <AuthField id="password" label="Password" error={fieldErrors.password}>
            <PasswordInput id="password" name="password" value={form.password} onChange={updateField} autoComplete="new-password" error={fieldErrors.password} />
          </AuthField>
          <AuthField id="confirmPassword" label="Confirm Password" error={fieldErrors.confirmPassword}>
            <PasswordInput id="confirmPassword" name="confirmPassword" value={form.confirmPassword} onChange={updateField} autoComplete="new-password" error={fieldErrors.confirmPassword} />
          </AuthField>
        </div>
        <p className="password-hint">Use 8 or more characters with uppercase, lowercase, and a number.</p>
        {formError && <p className="auth-form__error" role="alert">{formError}</p>}
        <Button type="submit" className="auth-submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Create Account'}
        </Button>
      </form>
      <div className="auth-divider"><span>or</span></div>
      <GoogleSignInButton label="Sign up with Google" />
    </AuthPageLayout>
  );
}

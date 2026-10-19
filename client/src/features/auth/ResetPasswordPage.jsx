import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../shared/components/index.js';
import { resetPassword } from './auth.api.js';
import { AuthField } from './AuthField.jsx';
import { AuthPageLayout } from './AuthPageLayout.jsx';
import { errorsFromIssues, passwordResetSchema } from './auth.schemas.js';
import { PasswordInput } from './PasswordInput.jsx';
import { PasswordRulesList } from './PasswordRulesList.jsx';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    if (!token) {
      setFormError('This reset link is missing its token. Request a new password reset link.');
      return;
    }
    const parsed = passwordResetSchema.safeParse(form);
    if (!parsed.success) {
      setFieldErrors(errorsFromIssues(parsed.error.issues));
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    try {
      await resetPassword({ token, newPassword: parsed.data.password });
      setIsComplete(true);
    } catch (error) {
      setFormError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthPageLayout
      title={isComplete ? 'Password updated' : 'Reset Password'}
      subtitle={isComplete ? 'You can sign in with your new password.' : 'Choose a new password for your account.'}
    >
      {isComplete ? (
        <div className="auth-success" role="status">
          <Button className="w-full text-sm" onClick={() => navigate('/login')}>
            Sign in
          </Button>
        </div>
      ) : (
        <form className={`grid gap-4      auth-form`} onSubmit={handleSubmit} noValidate>
          <AuthField id="password" label="New Password" error={fieldErrors.password}>
            <PasswordInput id="password" name="password" value={form.password} onChange={updateField} autoComplete="new-password" error={fieldErrors.password} />
          </AuthField>
          <AuthField id="confirmPassword" label="Confirm Password" error={fieldErrors.confirmPassword}>
            <PasswordInput id="confirmPassword" name="confirmPassword" value={form.confirmPassword} onChange={updateField} autoComplete="new-password" error={fieldErrors.confirmPassword} />
          </AuthField>
          <PasswordRulesList password={form.password} />
          {formError && <p className={`m-0 text-slate-500 text-sm auth-form__error`} role="alert">{formError}</p>}
          <Button type="submit" className={`w-full min-h-10 rounded-lg text-sm auth-submit`} disabled={isSubmitting}>{isSubmitting ? 'Updating…' : 'Update Password'}</Button>
        </form>
      )}
    </AuthPageLayout>
  );
}

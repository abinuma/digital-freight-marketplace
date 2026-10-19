import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Input } from "../../shared/components/index.js";
import { useAuth } from "./AuthContext.jsx";
import { AuthField } from "./AuthField.jsx";
import { AuthPageLayout } from "./AuthPageLayout.jsx";
import { GoogleSignInButton } from "./GoogleSignInButton.jsx";
import { errorsFromIssues, registrationSchema } from "./auth.schemas.js";
import { PasswordInput } from "./PasswordInput.jsx";
import { PasswordRulesList } from "./PasswordRulesList.jsx";

const initialForm = {
  firstName: "",
  lastName: "",
  role: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

const roles = [
  {
    value: "SHIPPER",
    title: "Shipper",
    detail: "I need to move goods",
  },
  {
    value: "TRANSPORTER",
    title: "Transporter",
    detail: "I own or drive trucks",
  },
];

export function RegistrationPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");
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
      navigate(
        user.profileComplete
          ? `/${user.role.toLowerCase()}`
          : "/complete-profile",
        { replace: true },
      );
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
      footer={
        <>
          Already have an account? <Link to="/login">Sign in</Link>
        </>
      }
    >
      <form
        className={`grid gap-4      auth-form gap-3 auth-form--registration`}
        onSubmit={handleSubmit}
        noValidate
      >
        <div
          className={`grid gap-3 auth-form__grid grid-cols-2 max-md:grid-cols-1 auth-form__grid--two`}
        >
          <AuthField
            id="firstName"
            label="First Name"
            error={fieldErrors.firstName}
          >
            <Input
              id="firstName"
              name="firstName"
              autoComplete="given-name"
              placeholder="Abebe"
              value={form.firstName}
              onChange={updateField}
              required
              aria-invalid={Boolean(fieldErrors.firstName)}
              aria-describedby={
                fieldErrors.firstName ? "firstName-error" : undefined
              }
            />
          </AuthField>
          <AuthField
            id="lastName"
            label="Last Name"
            error={fieldErrors.lastName}
          >
            <Input
              id="lastName"
              name="lastName"
              autoComplete="family-name"
              placeholder="Kebede"
              value={form.lastName}
              onChange={updateField}
              required
              aria-invalid={Boolean(fieldErrors.lastName)}
              aria-describedby={
                fieldErrors.lastName ? "lastName-error" : undefined
              }
            />
          </AuthField>
        </div>

        <fieldset className={`   min-w-0 m-0 p-0 border-0  role-choice`}>
          <legend>I am a:</legend>
          <div className={`grid grid-cols-2 gap-2 role-choice__grid`}>
            {roles.map((role) => (
              <label
                key={role.value}
                className={`relative grid min-h-20 justify-items-center gap-0.5 p-2 border rounded-lg bg-white cursor-pointer text-center transition hover:border-slate-500 role-choice__option${form.role === role.value ? " is-selected" : ""}${fieldErrors.role ? " border-red-500 ring-1 ring-red-500" : ""}`}
              >
                <input
                  type="radio"
                  name="role"
                  value={role.value}
                  required
                  checked={form.role === role.value}
                  onChange={updateField}
                  aria-invalid={Boolean(fieldErrors.role)}
                />
                <span
                  className={`text-slate-500 text-sm font-bold role-choice__title`}
                >
                  {role.title}
                </span>
                <span className={`text-slate-500 text-xs role-choice__detail`}>
                  {role.detail}
                </span>
              </label>
            ))}
          </div>
          {fieldErrors.role && (
            <p
              className={`mt-0.5 mx-0 mb-0 text-slate-500 text-sm auth-field__error`}
              role="alert"
            >
              {fieldErrors.role}
            </p>
          )}
        </fieldset>

        <AuthField id="email" label="Email Address" error={fieldErrors.email}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="abebe@example.com"
            value={form.email}
            onChange={updateField}
            required
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? "email-error" : undefined}
          />
        </AuthField>
        <AuthField id="phone" label="Phone Number" error={fieldErrors.phone}>
          <Input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="0912345678"
            maxLength={25}
            value={form.phone}
            onChange={updateField}
            required
            aria-invalid={Boolean(fieldErrors.phone)}
            aria-describedby={fieldErrors.phone ? "phone-error" : "phone-hint"}
          />
          <small id="phone-hint" className="text-xs text-slate-500">Enter a valid Ethiopian mobile</small>
        </AuthField>
        <div
          className={`grid gap-3 auth-form__grid grid-cols-2 max-md:grid-cols-1 auth-form__grid--two`}
        >
          <AuthField
            id="password"
            label="Password"
            error={fieldErrors.password}
          >
            <PasswordInput
              id="password"
              name="password"
              value={form.password}
              onChange={updateField}
              autoComplete="new-password"
              error={fieldErrors.password}
            />
          </AuthField>
          <AuthField
            id="confirmPassword"
            label="Confirm Password"
            error={fieldErrors.confirmPassword}
          >
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={updateField}
              autoComplete="new-password"
              error={fieldErrors.confirmPassword}
            />
          </AuthField>
        </div>
        <PasswordRulesList password={form.password} />
        {formError && (
          <p
            className={`m-0 text-slate-500 text-sm auth-form__error`}
            role="alert"
          >
            {formError}
          </p>
        )}
        <Button
          type="submit"
          className={`w-full min-h-10 rounded-lg text-sm auth-submit`}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating account…" : "Create Account"}
        </Button>
      </form>
      <div className="my-5 flex items-center justify-center gap-3 text-xs font-medium uppercase tracking-wide text-slate-400 auth-divider">
        <span className="h-px flex-1 bg-slate-200" />
        <span>or</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>
      <GoogleSignInButton label="Sign up with Google" />
    </AuthPageLayout>
  );
}

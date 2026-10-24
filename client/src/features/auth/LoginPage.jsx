import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Alert, Button, Input, Textarea } from "../../shared/components/index.js";
import { useAuth } from "./AuthContext.jsx";
import { AuthField } from "./AuthField.jsx";
import { AuthPageLayout } from "./AuthPageLayout.jsx";
import { GoogleSignInButton } from "./GoogleSignInButton.jsx";
import { errorsFromIssues, loginSchema } from "./auth.schemas.js";
import { PasswordInput } from "./PasswordInput.jsx";
import { submitSuspensionAppeal } from "./auth.api.js";

const roleHome = {
  SHIPPER: "/shipper",
  TRANSPORTER: "/transporter",
  ADMIN: "/admin",
};

function destinationFor(user, requestedPath) {
  if (!user) return "/login";
  if (!user.profileComplete) return "/complete-profile";
  if (requestedPath === "/profile") return requestedPath;
  const rolePath = roleHome[user.role] || "/";
  return requestedPath?.startsWith(rolePath) ? requestedPath : rolePath;
}

export function LoginPage() {
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuspended, setIsSuspended] = useState(false);
  const [appealOpen, setAppealOpen] = useState(false);
  const [appealMessage, setAppealMessage] = useState("");
  const [appealError, setAppealError] = useState("");
  const [appealSent, setAppealSent] = useState(false);
  const [isSendingAppeal, setIsSendingAppeal] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");
    const parsed = loginSchema.safeParse(form);
    if (!parsed.success) {
      setFieldErrors(errorsFromIssues(parsed.error.issues));
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    try {
      const user = await login({
        ...parsed.data,
        email: parsed.data.email.toLowerCase(),
      });
      navigate(destinationFor(user, location.state?.from?.pathname), {
        replace: true,
      });
    } catch (error) {
      if (error.status === 403 && /suspend/i.test(error.message || "")) {
        setIsSuspended(true);
        setFormError("");
      } else {
        setFormError(
          error.status === 401 || error.status === 404
            ? "Invalid credentials."
            : error.message,
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAppealSubmit(event) {
    event.preventDefault();
    setAppealError("");
    setIsSendingAppeal(true);
    try {
      await submitSuspensionAppeal({
        email: form.email.trim().toLowerCase(),
        message: appealMessage.trim(),
      });
      setAppealSent(true);
      setAppealOpen(false);
    } catch (error) {
      setAppealError(error.message);
    } finally {
      setIsSendingAppeal(false);
    }
  }

  return (
    <AuthPageLayout
      title="Welcome Back"
      subtitle="Please enter your details to sign in"
      footer={
        <>
          Don’t have an account?{" "}
          <Link
            className="font-semibold text-blue-700 no-underline transition-colors hover:text-blue-800 hover:underline"
            to="/register"
          >
            Sign up for free
          </Link>
        </>
      }
    >
      <form className="grid gap-5" onSubmit={handleSubmit} noValidate>
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
        <AuthField id="password" label="Password" error={fieldErrors.password}>
          <PasswordInput
            id="password"
            name="password"
            value={form.password}
            onChange={updateField}
            autoComplete="current-password"
            error={fieldErrors.password}
          />
        </AuthField>
        <div className="flex justify-end text-sm">
          <Link
            className="font-medium text-blue-700 no-underline transition-colors hover:text-blue-800 hover:underline"
            to="/forgot-password"
          >
            Forgot password?
          </Link>
        </div>
        {formError && (
          <p
            className="m-0 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            role="alert"
          >
            {formError}
          </p>
        )}
        <Button
          type="submit"
          className="w-full text-sm"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Signing in…" : "Sign In"}
        </Button>
      </form>
      {isSuspended && (
        <section className="mt-5 grid gap-3" aria-live="polite">
          {appealSent ? (
            <Alert tone="success">Your appeal has been sent to the support team. We’ll reach you soon if necessary.</Alert>
          ) : (
            <>
              <Alert tone="danger" title="Your account is suspended">
                <p className="m-0">If you believe this is a mistake, contact our support team.</p>
              </Alert>
              <Button type="button" variant="primary" onClick={() => { setAppealOpen((open) => !open); setAppealError(""); }}>
                {appealOpen ? "Close appeal form" : "Request an appeal"}
              </Button>
              {appealOpen && (
                <form className="grid gap-3" onSubmit={handleAppealSubmit}>
                  <label className="grid gap-1.5 text-sm font-semibold text-slate-800" htmlFor="suspension-appeal-message">
                    Message to the support team
                    <Textarea
                      id="suspension-appeal-message"
                      value={appealMessage}
                      onChange={(event) => setAppealMessage(event.target.value)}
                      maxLength={2000}
                      placeholder="Explain why you are requesting a review of your account suspension."
                      required
                    />
                  </label>
                  {appealError && <Alert tone="danger">{appealError}</Alert>}
                  <Button type="submit" disabled={isSendingAppeal || !appealMessage.trim()}>
                    {isSendingAppeal ? "Sending…" : "Send appeal"}
                  </Button>
                </form>
              )}
            </>
          )}
        </section>
      )}
      <div className="my-5 flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        <span>or</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>
      <GoogleSignInButton />
    </AuthPageLayout>
  );
}

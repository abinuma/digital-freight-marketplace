import { useState } from "react";
import { z } from "zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button, Input } from "../../shared/components/index.js";
import { requestPasswordReset } from "./auth.api.js";
import { AuthField } from "./AuthField.jsx";
import { AuthPageLayout } from "./AuthPageLayout.jsx";

const emailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address")
  .max(255);

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (location.key !== "default") {
      navigate(-1);
    } else {
      navigate("/login");
    }
  };
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setFieldError(
        parsed.error.issues[0]?.message || "Enter a valid email address",
      );
      return;
    }

    setFieldError("");
    setIsSubmitting(true);
    try {
      await requestPasswordReset(parsed.data.toLowerCase());
      setIsSubmitted(true);
    } catch (error) {
      setFormError(
        error.status === 404
          ? "No account was found with this email address."
          : error.status === 503
          ? "We couldn’t send the reset email right now. Please try again later."
          : error.message,
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthPageLayout
      title={isSubmitted ? "We have sent reset link" : "Forgot Password?"}
      subtitle={
        isSubmitted
          ? ""
          : "Enter your email and we’ll send you a link to reset your password."
      }
      icon={
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="8" cy="15" r="4" />
          <path d="m10.85 12.15 8.15-8.15 2 2-2 2 2 2-2 2-2-2-5.3 5.3" />
        </svg>
      }
      footer={<Link className="group inline-flex min-h-9 items-center gap-1.5 rounded-full border border-blue-200 bg-white px-4 text-sm font-semibold text-slate-900 no-underline transition-colors hover:border-blue-700 hover:bg-blue-700 hover:text-white" to="/login" onClick={(e) => { e.preventDefault(); handleBack(); }}><img src="/chevron-left-solid-full.svg" alt="" aria-hidden="true" className="h-3.5 w-3.5 group-hover:brightness-0 group-hover:invert" />Back</Link>}
    >
      {isSubmitted ? (
        <div
          className={`     grid gap-4 text-slate-500 text-base text-center   auth-success`}
          role="status"
        >
          <Button variant="secondary" onClick={() => setIsSubmitted(false)}>
            Try another email
          </Button>
        </div>
      ) : (
        <form
          className={`grid gap-4      auth-form`}
          onSubmit={handleSubmit}
          noValidate
        >
          <AuthField id="email" label="Email Address" error={fieldError}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="abebe@example.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setFieldError("");
              }}
              required
              aria-invalid={Boolean(fieldError)}
              aria-describedby={fieldError ? "email-error" : undefined}
            />
          </AuthField>
          {formError && (
            <p
              className="m-0 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 auth-form__error"
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
            {isSubmitting ? "Sending…" : "Send Reset Link"}
          </Button>
        </form>
      )}
    </AuthPageLayout>
  );
}

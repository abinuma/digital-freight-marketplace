import { useState } from "react";
import { Button } from "../../shared/components/index.js";
import { useAuth } from "./AuthContext.jsx";

export function GoogleSignInButton({ label = "Continue with Google" }) {
  const { startGoogleSignIn } = useAuth();
  const [error, setError] = useState("");
  const [isStarting, setIsStarting] = useState(false);

  async function handleClick() {
    setError("");
    setIsStarting(true);
    try {
      const url = await startGoogleSignIn(`${window.location.origin}/`);
      window.location.assign(url);
    } catch (requestError) {
      setError(requestError.message);
      setIsStarting(false);
    }
  }

  return (
    <>
      <Button
        variant="secondary"
        className="w-full text-sm"
        onClick={handleClick}
        disabled={isStarting}
      >
        <span
          className="text-base font-extrabold text-blue-700"
          aria-hidden="true"
        >
          G
        </span>
        {isStarting ? "Connecting to Google…" : label}
      </Button>
      {error && (
        <p
          className={`m-0 text-slate-500 text-sm auth-form__error`}
          role="alert"
        >
          {error}
        </p>
      )}
    </>
  );
}

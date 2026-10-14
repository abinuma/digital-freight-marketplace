import { useEffect, useState } from "react";
import { Button } from "../../shared/components/index.js";
import { useAuth } from "./AuthContext.jsx";

export function GoogleSignInButton({ label = "Continue with Google" }) {
  const { startGoogleSignIn } = useAuth();
  const [error, setError] = useState("");
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    function resetStarting() {
      setIsStarting(false);
    }

    // Handles back/forward cache (bfcache) when user clicks the browser back button
    window.addEventListener("pageshow", resetStarting);
    window.addEventListener("focus", resetStarting);
    window.addEventListener("popstate", resetStarting);

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        setIsStarting(false);
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pageshow", resetStarting);
      window.removeEventListener("focus", resetStarting);
      window.removeEventListener("popstate", resetStarting);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  async function handleClick() {
    setError("");
    setIsStarting(true);
    try {
      const url = await startGoogleSignIn(`${window.location.origin}/`);
      window.location.assign(url);
      // Fallback reset in case navigation is aborted or delayed
      setTimeout(() => {
        setIsStarting(false);
      }, 4000);
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
          className="m-0 text-slate-500 text-sm auth-form__error"
          role="alert"
        >
          {error}
        </p>
      )}
    </>
  );
}

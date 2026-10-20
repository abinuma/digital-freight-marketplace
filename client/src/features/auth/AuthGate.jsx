import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { Button } from "../../shared/components/index.js";
import { useAuth } from "./AuthContext.jsx";
import { ProfileCompletionForm } from "./ProfileCompletionForm.jsx";
import LandingPage from "./LandingPage.jsx";

export function AuthGate() {
  const {
    user,
    isLoading,
    refreshUser,
    startGoogleSignIn,
    logout,
  } = useAuth();
  const location = useLocation();
  const [isStartingSignIn, setIsStartingSignIn] = useState(false);
  const [actionError, setActionError] = useState("");

  async function handleLogout() {
    setActionError("");
    try {
      await logout();
    } catch (requestError) {
      setActionError(requestError.message);
    }
  }

  async function handleGoogleSignIn() {
    setActionError("");
    setIsStartingSignIn(true);
    try {
      const authorizationUrl = await startGoogleSignIn(window.location.origin);
      window.location.assign(authorizationUrl);
    } catch (requestError) {
      setActionError(requestError.message);
      setIsStartingSignIn(false);
    }
  }

  if (location.pathname !== "/" && isLoading) {
    return (
      <main
        className={`flex min-h-screen flex-col items-center justify-center  bg-gray-100 text-slate-800 text-center         landing`}
        aria-live="polite"
      >
        <p>Checking your sign-in…</p>
      </main>
    );
  }

  if (location.pathname === "/" && !user) return <LandingPage />;

  if (!user) return <Navigate to="/" replace />;

  if (location.pathname === "/") {
    if (!user.profileComplete)
      return <Navigate to="/complete-profile" replace />;
    const roleHome = {
      SHIPPER: "/shipper",
      TRANSPORTER: "/transporter",
      ADMIN: "/admin",
    };
    return <Navigate to={roleHome[user.role] || "/login"} replace />;
  }

  if (user && !user.profileComplete) {
    return (
      <main
        className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-10 text-slate-800"
      >
        <div
          className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-700 text-base font-extrabold tracking-wide text-white shadow-sm"
          aria-hidden="true"
        >
          EF
        </div>
        <ProfileCompletionForm />
      </main>
    );
  }

  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-center  bg-gray-100 text-slate-800 text-center         landing`}
    >
      <div
        className={`grid w-14 h-14 place-items-center rounded-2xl bg-blue-700 shadow-sm text-white font-display text-base font-extrabold tracking-wide brand-mark`}
        aria-hidden="true"
      >
        EF
      </div>
      <p
        className={`mt-5 mx-0 mb-2 text-blue-700 text-sm font-bold tracking-widest uppercase eyebrow`}
      >
        EthioFreight
      </p>
      <h1>{user ? `Welcome, ${user.name}` : "Freight moving forward."}</h1>
      <p
        className={`max-w-7xl mt-4 mx-0 mb-0 text-slate-500  leading-relaxed intro`}
      >
        {user
          ? "Your profile is complete. The marketplace is being prepared."
          : "A simpler way for shippers and transporters to connect. Sign in with Google to get started."}
      </p>

      {actionError && (
        <p className={`text-red-700 text-base form-error`} role="alert">
          {actionError}
        </p>
      )}
      {!user && (
        <Button
          className={`min-h-12 mt-4 py-3 px-4 border rounded-lg bg-blue-700 text-white cursor-pointer font-bold transition    disabled:cursor-wait disabled:opacity-75 primary-button`}
          onClick={handleGoogleSignIn}
          disabled={isStartingSignIn}
        >
          {isStartingSignIn ? "Connecting to Google…" : "Continue with Google"}
        </Button>
      )}
      {user && (
        <>
          <div
            className={`inline-flex items-center gap-2 mt-8 py-3 px-4 border rounded-2xl bg-slate-500 text-slate-800 text-base availability`}
          >
            <span
              className={`w-2 h-2 rounded-full bg-amber-700 status-dot`}
              aria-hidden="true"
            />
            <span>Platform setup in progress</span>
          </div>
          <div
            className={`flex items-center gap-4 mt-4      auth-landing-actions`}
          >
            <Link to="/profile">Manage profile</Link>
            <Button variant="secondary" onClick={handleLogout}>
              Log out
            </Button>
          </div>
        </>
      )}
    </main>
  );
}

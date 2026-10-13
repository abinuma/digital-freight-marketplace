import { Navigate, Outlet } from "react-router-dom";
import { Button } from "../../shared/components/index.js";
import { useAuth } from "./AuthContext.jsx";

const roleHome = {
  SHIPPER: "/shipper",
  TRANSPORTER: "/transporter",
  ADMIN: "/admin",
};

export function PublicOnlyRoute() {
  const { user, isLoading, isError, error, refreshUser } = useAuth();

  if (isLoading)
    return (
      <main
        className={`flex min-h-screen flex-col items-center justify-center  bg-gray-100 text-slate-800 text-center         landing`}
        aria-live="polite"
      >
        <p>Checking your sign-in…</p>
      </main>
    );
  if (isError) {
    return (
      <main
        className={`flex min-h-screen flex-col items-center justify-center  bg-gray-100 text-slate-800 text-center         landing`}
      >
        <p className={`text-red-700 text-base form-error`} role="alert">
          {error.message}
        </p>
        <Button
          variant="secondary"
          onClick={() => refreshUser().catch(() => undefined)}
        >
          Try again
        </Button>
      </main>
    );
  }
  if (user)
    return (
      <Navigate
        to={
          user.profileComplete
            ? roleHome[user.role] || "/"
            : "/complete-profile"
        }
        replace
      />
    );
  return <Outlet />;
}

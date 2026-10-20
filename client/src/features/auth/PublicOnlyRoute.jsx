import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";

const roleHome = {
  SHIPPER: "/shipper",
  TRANSPORTER: "/transporter",
  ADMIN: "/admin",
};

export function PublicOnlyRoute() {
  const { user, isLoading, isError } = useAuth();

  if (isLoading)
    return (
      <main
        className={`flex min-h-screen flex-col items-center justify-center  bg-gray-100 text-slate-800 text-center         landing`}
        aria-live="polite"
      >
        <p>Checking your sign-in…</p>
      </main>
    );
  // Network/server error — we can't confirm auth status, but these are
  // public pages so let the user continue (e.g. fill in the login form).
  // If the user IS logged in, refetchOnReconnect will pick it up later.
  if (isError) return <Outlet />;
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

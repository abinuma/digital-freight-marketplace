import { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Button, Spinner } from '../../shared/components/index.js';
import { useAuth } from './AuthContext.jsx';

const roleHome = {
  SHIPPER: '/shipper',
  TRANSPORTER: '/transporter',
  ADMIN: '/admin',
};

export function RequireAuth() {
  const { user, isAuthenticated, isLoading, isError, refreshUser } = useAuth();
  const location = useLocation();
  const [isRetrying, setIsRetrying] = useState(false);

  if (isLoading) return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-100 text-center text-slate-800 landing" aria-live="polite">
      <Spinner label="Loading" className="h-8 w-8 border-[3px]" />
      <p className="text-sm font-medium text-slate-600">Loading...</p>
    </main>
  );

  // Session is definitively gone: the query succeeded but returned null
  // (meaning the server responded with 401 and loadCurrentUser returned null).
  // Redirect to the landing page.
  if (!isAuthenticated && !isError) return <Navigate to="/" replace state={{ from: location }} />;

  // Network / server error on initial load — no cached user available.
  // Show a connection-error screen with a retry button instead of
  // redirecting to the landing page (the session may still be valid).
  if (isError && !isAuthenticated) {
    async function handleRetry() {
      setIsRetrying(true);
      try {
        await refreshUser();
      } catch {
        // refreshUser re-throws; the query will stay in error state
        // and this screen will remain visible.
      } finally {
        setIsRetrying(false);
      }
    }

    return (
      <main
        className="flex min-h-screen flex-col items-center justify-center bg-gray-100 px-4 text-slate-800 text-center"
        aria-live="polite"
      >
        <p className="text-lg font-semibold">Unable to connect</p>
        <p className="mt-2 max-w-md text-slate-500">
          We couldn't reach the server to verify your session. Check your
          internet connection and try again.
        </p>
        <Button
          className="mt-6"
          onClick={handleRetry}
          disabled={isRetrying}
        >
          {isRetrying ? 'Retrying…' : 'Retry'}
        </Button>
      </main>
    );
  }

  // isError && isAuthenticated: a network/server error occurred during a
  // refetch, but we still have a cached user from the last successful
  // fetch.  Proceed normally — the NetworkErrorToaster will notify the
  // user about the connection problem.

  if (location.pathname === '/complete-profile' && user.profileComplete) {
    return <Navigate to={roleHome[user.role] || '/'} replace />;
  }
  if (!user.profileComplete && location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

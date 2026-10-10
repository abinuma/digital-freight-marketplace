import { Navigate, Outlet } from 'react-router-dom';
import { Button } from '../../shared/components/index.js';
import { useAuth } from './AuthContext.jsx';

const roleHome = { SHIPPER: '/shipper', TRANSPORTER: '/transporter', ADMIN: '/admin' };

export function PublicOnlyRoute() {
  const { user, isLoading, isError, error, refreshUser } = useAuth();

  if (isLoading) return <main className="landing" aria-live="polite"><p>Checking your sign-in…</p></main>;
  if (isError) {
    return (
      <main className="landing">
        <p className="form-error" role="alert">{error.message}</p>
        <Button variant="secondary" onClick={() => refreshUser().catch(() => undefined)}>Try again</Button>
      </main>
    );
  }
  if (user) return <Navigate to={user.profileComplete ? (roleHome[user.role] || '/') : '/complete-profile'} replace />;
  return <Outlet />;
}

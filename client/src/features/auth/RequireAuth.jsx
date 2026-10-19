import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

const roleHome = {
  SHIPPER: '/shipper',
  TRANSPORTER: '/transporter',
  ADMIN: '/admin',
};

export function RequireAuth() {
  const { user, isAuthenticated, isLoading, isError } = useAuth();
  const location = useLocation();

  if (isLoading) return <main className={`flex min-h-screen flex-col items-center justify-center  bg-gray-100 text-slate-800 text-center         landing`} aria-live="polite"><p>Checking your sign-in…</p></main>;
  if (isError || !isAuthenticated) return <Navigate to="/" replace state={{ from: location }} />;

  if (location.pathname === '/complete-profile' && user.profileComplete) {
    return <Navigate to={roleHome[user.role] || '/'} replace />;
  }
  if (!user.profileComplete && location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

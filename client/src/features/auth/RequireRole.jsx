import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

export function RequireRole({ roles }) {
  const { user } = useAuth();
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  if (!user || !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}

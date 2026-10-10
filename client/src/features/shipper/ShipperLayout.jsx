import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { Button } from '../../shared/components/index.js';
import { NotificationBell } from '../notifications/NotificationBell.jsx';

export function ShipperLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initials = (user?.name || user?.email || 'S').slice(0, 1).toUpperCase();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="shipper-app">
      <header className="shipper-topbar">
        <NavLink className="shipper-brand" to="/shipper" aria-label="EthioFreight home"><span className="shipper-brand__mark">E</span>EthioFreight</NavLink>
        <div className="shipper-topbar__user"><NotificationBell /><span className="shipper-avatar">{initials}</span><span>{user?.name || 'Shipper'}</span><Button variant="ghost" size="sm" onClick={handleLogout}>Sign out</Button></div>
      </header>
      <div className="shipper-frame">
        <aside className="shipper-sidebar">
          <p className="shipper-sidebar__label">SHIPPER WORKSPACE</p>
          <nav aria-label="Shipper navigation">
            <NavLink end to="/shipper">▦ <span>Dashboard</span></NavLink>
            <NavLink to="/shipper/shipments">▤ <span>My shipments</span></NavLink>
            <NavLink to="/shipper/shipments/new">＋ <span>Post a shipment</span></NavLink>
            <NavLink to="/profile">◉ <span>My profile</span></NavLink>
          </nav>
          <div className="shipper-sidebar__help"><span>Need help?</span><small>We’re here to help with your shipments.</small></div>
        </aside>
        <main className="shipper-main"><Outlet /></main>
      </div>
    </div>
  );
}

import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { Button } from '../../shared/components/index.js'

export function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="shipper-app admin-app">
      <header className="shipper-topbar">
        <NavLink className="shipper-brand" to="/admin" aria-label="EthioFreight admin home"><span className="shipper-brand__mark">E</span>EthioFreight <span className="admin-brand-label">ADMIN</span></NavLink>
        <div className="shipper-topbar__user"><span className="shipper-avatar">{(user?.name || 'A').slice(0, 1).toUpperCase()}</span><span>{user?.name || 'Administrator'}</span><Button variant="ghost" size="sm" onClick={handleLogout}>Sign out</Button></div>
      </header>
      <div className="shipper-frame">
        <aside className="shipper-sidebar">
          <p className="shipper-sidebar__label">ADMIN WORKSPACE</p>
          <nav aria-label="Admin navigation">
            <NavLink end to="/admin">▦ <span>Overview</span></NavLink>
            <NavLink to="/admin/users">♙ <span>User management</span></NavLink>
          </nav>
          <div className="shipper-sidebar__help"><span>Platform controls</span><small>Manage marketplace accounts and activity.</small></div>
        </aside>
        <main className="shipper-main"><Outlet /></main>
      </div>
    </div>
  )
}

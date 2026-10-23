import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { UserMenu } from '../../shared/components/index.js';

const navigation = [
  { to: '/admin', icon: '/dashboard-svgrepo-com.svg', label: 'Overview', end: true },
  { to: '/admin/users', icon: '/user-solid-full.svg', label: 'Users' },
  { to: '/admin/suspension-appeals', icon: '/message-regular-full.svg', label: 'Suspension appeals' },
];

export function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  function renderNavigation(onNavigate = () => {}) {
    return navigation.map(({ to, icon, label, end }) => (
      <NavLink key={to} end={end} to={to} onClick={onNavigate} className={({ isActive }) => `flex min-h-10 items-center gap-3 whitespace-nowrap rounded-lg px-3 text-sm font-medium no-underline transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
        <span className="w-5 shrink-0 text-center" aria-hidden="true"><img src={icon} alt="" className="mx-auto h-5 w-5 brightness-0 invert" /></span>
        <span>{label}</span>
      </NavLink>
    ));
  }
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
        <NavLink className="inline-flex items-center gap-1.5 font-display text-lg font-extrabold tracking-tight text-slate-900 no-underline" to="/admin" aria-label="FETAN admin home">
          <img src="/logoFETAN.svg" alt="" aria-hidden="true" className="h-9 w-9 rounded-lg object-contain" />
          FETAN
          <span className="rounded bg-slate-100 px-2 py-1 text-xs font-extrabold tracking-wide text-blue-700">ADMIN</span>
        </NavLink>
        <div className="flex items-center gap-3">
          <button type="button" className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 lg:hidden" aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={menuOpen} aria-controls="admin-mobile-navigation" onClick={() => setMenuOpen((open) => !open)}>
            {menuOpen ? <img src="/xmark-solid-full.svg" alt="" aria-hidden="true" className="h-4 w-4" /> : <img src="/menu.svg" alt="" aria-hidden="true" className="h-5 w-5 object-contain" />}
          </button>
          <div className="hidden lg:block"><UserMenu /></div>
        </div>
      </header>
      {menuOpen && (
        <nav id="admin-mobile-navigation" className="fixed right-0 top-16 z-40 grid w-[min(22rem,82vw)] content-start gap-1 overflow-y-auto border-l border-slate-700 bg-slate-900 px-3 py-3 text-white shadow-2xl lg:hidden" style={{ height: 'calc(100dvh - 4rem)' }} aria-label="Admin navigation">
          {renderNavigation(() => setMenuOpen(false))}
          <div onClick={() => setMenuOpen(false)}><UserMenu inline /></div>
        </nav>
      )}
      <div className="flex flex-1 max-md:flex-col">
        <aside className="sticky top-16 hidden w-56 shrink-0 flex-col self-stretch bg-slate-900 px-3 py-5 text-white lg:flex">
          <p className="mb-4 px-3 text-xs font-extrabold tracking-widest text-slate-400 max-md:hidden">ADMIN WORKSPACE</p>
          <nav className="grid gap-1" aria-label="Admin navigation">{renderNavigation()}</nav>
        </aside>
        <main className="min-w-0 flex-1"><Outlet /></main>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { UserMenu } from '../../shared/components/index.js';
import { useUnreadCount } from '../notifications/useUnreadCount.js';

const navigation = [
  { to: '/transporter', icon: '/dashboard-svgrepo-com.svg', label: 'Dashboard', end: true },
  { to: '/transporter/shipments', icon: '/box-solid-full.svg', label: 'Shipments' },
  { to: '/transporter/bids', icon: '/auction-bid-svgrepo-com.svg', label: 'Bids' },
  { to: '/transporter/journey-plans', icon: '/road-solid-full.svg', label: 'Journey plans' },
  { to: '/transporter/messages', icon: '/message-regular-full.svg', label: 'Messages' },
];

export function TransporterLayout() {
  const unreadCount = useUnreadCount();

  const [menuOpen, setMenuOpen] = useState(false);

  function renderNavigation(onNavigate = () => {}, showIcons = true) {
    return navigation.map(({ to, icon, label, end }) => (
      <NavLink key={to} end={end} to={to} onClick={onNavigate} className={({ isActive }) => `flex min-h-10 items-center gap-3 whitespace-nowrap rounded-lg px-3 text-sm font-medium no-underline transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
        {showIcons && <span className="w-5 text-center text-base" aria-hidden="true">
          {icon.startsWith('/') ? <img src={icon} alt="" className="mx-auto h-5 w-5 brightness-0 invert" /> : icon}
        </span>}
        <span className="inline-flex items-center gap-1.5">
          <span>{label}</span>
          {label === 'Messages' && unreadCount > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-xs font-bold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </span>
      </NavLink>
    ));
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
        <NavLink className="inline-flex items-center gap-1.5 font-display text-lg font-extrabold tracking-tight text-slate-900 no-underline transition-colors hover:text-blue-700" to="/transporter" aria-label="FETAN home">
          <img src="/logoFETAN.svg" alt="" aria-hidden="true" className="h-9 w-9 rounded-lg object-contain" />
          FETAN
        </NavLink>
        <div className="flex items-center gap-3">
          <button type="button" className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 lg:hidden" aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={menuOpen} aria-controls="transporter-mobile-navigation" onClick={() => setMenuOpen((open) => !open)}>
            {menuOpen ? <img src="/xmark-solid-full.svg" alt="" aria-hidden="true" className="h-4 w-4" /> : <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>}
          </button>
          <div className="hidden lg:block"><UserMenu /></div>
        </div>
      </header>
      {menuOpen && (
        <nav id="transporter-mobile-navigation" className="fixed right-0 top-16 z-40 grid w-[min(22rem,82vw)] content-start gap-1 overflow-y-auto border-l border-slate-700 bg-slate-900 px-3 py-3 text-white shadow-2xl lg:hidden" style={{ height: 'calc(100dvh - 4rem)' }} aria-label="Transporter navigation">
          {renderNavigation(() => setMenuOpen(false), false)}
          <div onClick={() => setMenuOpen(false)}><UserMenu inline /></div>
        </nav>
      )}
      <div className="flex flex-1 max-md:flex-col">
        <aside className="sticky top-16 hidden w-56 shrink-0 flex-col self-stretch bg-slate-900 px-3 py-5 text-white lg:flex">
          <p className="mb-4 px-3 text-xs font-extrabold tracking-widest text-slate-400 max-md:hidden">TRANSPORTER WORKSPACE</p>
          <nav className="grid gap-1" aria-label="Transporter navigation">{renderNavigation()}</nav>
          <div className="mt-auto grid gap-1 rounded-lg border border-slate-700 bg-slate-800 p-4 text-sm max-md:hidden">
            <strong>Need help?</strong>
            <small className="text-slate-300">We’re here to help with your deliveries.</small>
          </div>
        </aside>
        <main className="min-w-0 flex-1"><Outlet /></main>
      </div>
    </div>
  );
}

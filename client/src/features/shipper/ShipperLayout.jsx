import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { Button } from "../../shared/components/index.js";
import { NotificationBell } from "../notifications/NotificationBell.jsx";

const navigation = [
  { to: "/shipper", icon: "▦", label: "Dashboard", end: true },
  { to: "/shipper/shipments", icon: "▤", label: "My shipments", end: true },
  { to: "/shipper/shipments/new", icon: "＋", label: "Post a shipment" },
  { to: "/shipper/messages", icon: "✉", label: "Messages" },
  { to: "/profile", icon: "◉", label: "My profile" },
];

export function ShipperLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initials = (user?.name || user?.email || "S").slice(0, 1).toUpperCase();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
        <NavLink
          className="inline-flex items-center gap-3 font-display text-lg font-extrabold tracking-tight text-slate-900 no-underline transition-colors hover:text-blue-700"
          to="/shipper"
          aria-label="EthioFreight home"
        >
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-700 font-sans text-base text-white">
            E
          </span>
          EthioFreight
        </NavLink>
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
          <NotificationBell />
          <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-200 font-bold text-blue-700">
            {initials}
          </span>
          <span className="hidden sm:inline">{user?.name || "Shipper"}</span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Sign out
          </Button>
        </div>
      </header>
      <div className="flex flex-1 max-md:flex-col">
        <aside className="sticky top-16 flex w-56 shrink-0 flex-col self-stretch bg-slate-900 px-3 py-5 text-white max-md:static max-md:h-auto max-md:w-full max-md:flex-row max-md:overflow-x-auto max-md:py-2">
          <p className="mb-4 px-3 text-xs font-extrabold tracking-widest text-slate-400 max-md:hidden">
            SHIPPER WORKSPACE
          </p>
          <nav
            className="grid gap-1 max-md:flex max-md:gap-1"
            aria-label="Shipper navigation"
          >
            {navigation.map(({ to, icon, label, end }) => (
              <NavLink
                key={to}
                end={end}
                to={to}
                className={({ isActive }) =>
                  `flex min-h-10 items-center gap-3 whitespace-nowrap rounded-lg px-3 text-sm font-medium no-underline transition-colors ${isActive ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`
                }
              >
                <span className="w-5 text-center text-base" aria-hidden="true">
                  {icon}
                </span>
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto grid gap-1 rounded-lg border border-slate-700 bg-slate-800 p-4 text-sm max-md:hidden">
            <strong>Need help?</strong>
            <small className="text-slate-300">
              We’re here to help with your shipments.
            </small>
          </div>
        </aside>
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

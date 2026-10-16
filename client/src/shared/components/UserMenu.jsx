import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext.jsx';
import { PreviewableImage } from './PreviewableImage.jsx';

/**
 * UserMenu – header avatar dropdown for all roles.
 *
 * Shows: circular avatar (profile photo or initials) + first name + chevron.
 * Dropdown: full name label, My Profile link, Sign out.
 */
export function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const fullName = user?.name || 'User';
  const firstName = fullName.split(' ')[0];
  const initials = (user?.name || user?.email || 'U').slice(0, 1).toUpperCase();
  const avatar = user?.profilePhoto || user?.image || null;
  const [imageFailed, setImageFailed] = useState(false);

  const toggle = useCallback(() => setOpen((prev) => !prev), []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  async function handleSignOut() {
    setOpen(false);
    await logout();
    navigate('/login', { replace: true });
  }

  function handleProfile() {
    setOpen(false);
    navigate('/profile');
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={toggle}
        className="flex items-center gap-2 rounded-full border border-transparent px-1 py-1 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 pr-2 sm:pr-3"
        aria-haspopup="true"
        aria-expanded={open}
      >
        {/* Avatar circle */}
        {avatar && !imageFailed ? (
          <PreviewableImage
            src={avatar}
            alt={fullName}
            className="h-9 w-9 rounded-full object-cover"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
            nestedInteractive
          />
        ) : (
          <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-200 font-bold text-blue-700">
            {initials}
          </span>
        )}

        {/* First name */}
        <span className="hidden sm:inline">{firstName}</span>

        {/* Dropdown icon */}
        <svg
          className={`h-4 w-4 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {/* Account owner name */}
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Account</p>
            <p className="mt-0.5 text-sm font-bold text-slate-900">{fullName}</p>
            {user?.email && <p className="truncate text-xs text-slate-500">{user.email}</p>}
          </div>

          {/* My Profile */}
          <button
            type="button"
            onClick={handleProfile}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
          >
            <span className="text-base" aria-hidden="true">◉</span>
            My profile
          </button>

          {/* Sign out */}
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
          >
            <span className="text-base" aria-hidden="true">⎋</span>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  CampaignsIcon,
  ContactsIcon,
  PlusIcon,
  AdminIcon,
  LogoutIcon,
  BoltIcon,
  ChevronIcon,
} from './Icons';

function getSection(pathname) {
  if (pathname === '/campaigns/new') return 'New campaign';
  if (pathname.startsWith('/campaigns/')) return 'Campaign report';
  if (pathname === '/contacts') return 'Contacts';
  if (pathname === '/admin') return 'Admin';
  return 'Campaigns';
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (to) => {
    if (to === '/') return pathname === '/' || (pathname.startsWith('/campaigns/') && pathname !== '/campaigns/new');
    return pathname === to;
  };

  const navItem = (to, label, Icon) => (
    <Link
      key={to}
      to={to}
      className={`flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        isActive(to)
          ? 'bg-slate-100 text-slate-900'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <Icon />
      {label}
    </Link>
  );

  return (
    <div className="min-h-screen md:flex">
      <aside className="border-b border-slate-200 bg-white md:sticky md:top-0 md:flex md:h-screen md:w-60 md:shrink-0 md:flex-col md:border-b-0 md:border-r">
        <div className="flex items-center gap-2 px-5 py-4 md:py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-sm font-semibold text-white">
            S
          </div>
          <span className="text-base font-semibold tracking-tight">SMS Campaigns</span>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:pb-0">
          {navItem('/', 'Campaigns', CampaignsIcon)}
          {navItem('/campaigns/new', 'New campaign', PlusIcon)}
          {navItem('/contacts', 'Contacts', ContactsIcon)}
          {user?.role === 'ADMIN' && navItem('/admin', 'Admin', AdminIcon)}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">Workspace</span>
            <span className="text-slate-300">/</span>
            <span className="font-medium text-slate-900">{getSection(pathname)}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 py-1 pl-2.5 pr-3 text-sm">
              <span className="text-amber-500">
                <BoltIcon />
              </span>
              <span className="font-semibold tabular-nums text-slate-900">
                {user?.credits?.toLocaleString()}
              </span>
              <span className="text-slate-500">credits</span>
            </div>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((open) => !open)}
                className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-slate-100"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
                <span className="hidden text-sm font-medium text-slate-700 sm:block">{user?.name}</span>
                <span className="text-slate-400">
                  <ChevronIcon />
                </span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                  <div className="border-b border-slate-100 px-4 py-3">
                    <p className="truncate text-sm font-medium text-slate-900">{user?.name}</p>
                    <p className="truncate text-xs text-slate-500">{user?.email}</p>
                    <p className="mt-1 text-xs text-slate-400">{user?.role === 'ADMIN' ? 'Administrator' : 'Member'}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    <LogoutIcon />
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

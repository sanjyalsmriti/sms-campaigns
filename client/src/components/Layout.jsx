import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLink = (to, label) => {
    const active = location.pathname === to;
    return (
      <Link
        to={to}
        className={`px-3 py-2 rounded text-sm font-medium ${
          active ? 'bg-blue-700 text-white' : 'text-blue-100 hover:bg-blue-500'
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-blue-600 shadow">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-1">
            <Link to="/" className="text-white font-semibold text-lg mr-6">
              SMS Campaign
            </Link>
            {navLink('/', 'Campaigns')}
            {navLink('/contacts', 'Contacts')}
            {navLink('/campaigns/new', 'New Campaign')}
            {user?.role === 'ADMIN' && navLink('/admin', 'Admin')}
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-blue-100">
              {user?.name} · <span className="font-semibold text-white">{user?.credits}</span> credits
            </span>
            <button onClick={handleLogout} className="text-blue-100 hover:text-white">
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}

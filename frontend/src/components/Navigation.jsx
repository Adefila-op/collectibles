import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const Navigation = () => {
  const { user, logout, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/browse', label: 'Explore', icon: '🎨' },
    { path: '/my-collection', label: 'Collection', icon: '📦' },
    { path: '/my-offers', label: 'Offers', icon: '🤝' },
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  ];

  return (
    <>
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-full px-4 h-14 flex justify-between items-center">
          <Link to="/" className="text-base font-medium text-dark">
            🎨 ArtChain Africa
          </Link>

          <button
            className="md:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? '✕' : '☰'}
          </button>

          {/* Desktop Menu */}
          <div className="hidden md:flex gap-6 items-center">
            <Link to="/browse" className="text-sm hover:text-primary">Browse</Link>
            
            {isAuthenticated ? (
              <>
                <Link to="/my-collection" className="text-sm hover:text-primary">My Collection</Link>
                <Link to="/my-offers" className="text-sm hover:text-primary">Offers</Link>
                <Link to="/dashboard" className="text-sm hover:text-primary">Dashboard</Link>
                <button
                  onClick={handleLogout}
                  className="bg-dark text-gold px-3 py-1 rounded text-sm font-medium hover:opacity-90"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm hover:text-primary">Login</Link>
                <Link to="/register" className="bg-dark text-gold px-3 py-1 rounded text-sm font-medium hover:opacity-90">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <Link to="/browse" className="block px-4 py-3 text-sm hover:bg-gray-100">Browse</Link>
            {isAuthenticated ? (
              <>
                <Link to="/my-collection" className="block px-4 py-3 text-sm hover:bg-gray-100">My Collection</Link>
                <Link to="/my-offers" className="block px-4 py-3 text-sm hover:bg-gray-100">Offers</Link>
                <Link to="/dashboard" className="block px-4 py-3 text-sm hover:bg-gray-100">Dashboard</Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-3 text-sm hover:bg-gray-100 text-primary"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="block px-4 py-3 text-sm hover:bg-gray-100">Login</Link>
                <Link to="/register" className="block px-4 py-3 text-sm hover:bg-gray-100 text-primary">Sign Up</Link>
              </>
            )}
          </div>
        )}
      </nav>

      {/* Bottom Mobile Navigation (only when authenticated) */}
      {isAuthenticated && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden">
          <div className="flex justify-around items-center h-16">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition ${
                  isActive(item.path)
                    ? 'text-primary'
                    : 'text-gray-600'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-2xs font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      )}

      {/* Spacer for bottom nav */}
      {isAuthenticated && <div className="h-16 md:hidden"></div>}
    </>
  );
};

export default Navigation;

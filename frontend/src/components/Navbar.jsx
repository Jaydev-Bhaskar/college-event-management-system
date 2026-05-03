import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) => location.pathname === path ? 'active' : '';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'admin': return '/admin';
      case 'organizer': return '/organizer';
      default: 
        if (user.baseRole === 'teacher') return '/organizer';
        return '/dashboard';
    }
  };

  // Don't show navbar on landing page
  if (location.pathname === '/') return null;

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        <div className="logo-icon"><Zap size={18} /></div>
        UniEvents
      </Link>

      <div className="navbar-links">
        <Link to="/events" className={isActive('/events')}>Events</Link>
        
        {user ? (
          <>
            <Link to={getDashboardPath()} className={isActive(getDashboardPath())}>Dashboard</Link>
            <Link to="/profile" className={isActive('/profile')}>Profile</Link>
            <button onClick={handleLogout} className="btn btn-ghost btn-sm">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className={isActive('/login')}>Login</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}

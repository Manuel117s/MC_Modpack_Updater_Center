import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/authContext';

function Navbar() {
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();

  // Hide nav on auth pages for a cleaner look
  const authRoutes = ['/login', '/signin'];
  if (authRoutes.includes(location.pathname)) return null;

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        ⬡ CurseModpack
      </Link>

      <div className="navbar-links">
        {isAuthenticated ? (
          <>
            <Link to="/dashboard">
              <button className="btn btn-ghost">Dashboard</button>
            </Link>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginRight: '0.5rem' }}>
              Hi, <strong>{user?.username}</strong>
            </span>
            <button className="btn btn-outline btn-sm" onClick={logout}>
              Log Out
            </button>
          </>
        ) : (
          <>
            <Link to="/login">
              <button className="btn btn-ghost">Log In</button>
            </Link>
            <Link to="/signin">
              <button className="btn btn-primary">Get Started</button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
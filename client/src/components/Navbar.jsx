import { Menu, Search, ShieldCheck, User } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  function signOut() {
    logout();
    navigate('/');
  }

  const close = () => setOpen(false);

  return (
    <header className="navbar">
      <Link className="brand" to="/" onClick={close}>
        <div className="brand-icon">
          <Search size={20} />
        </div>
        <span>FindIt</span>
      </Link>

      <button
        className="menu-button"
        onClick={() => setOpen(!open)}
        aria-label="Toggle navigation"
      >
        <Menu size={22} />
      </button>

      <nav className={open ? 'nav-links open' : 'nav-links'}>
        <NavLink to="/items" onClick={close}>
          Browse
        </NavLink>

        {user && (
          <NavLink to="/report" onClick={close}>
            Report Item
          </NavLink>
        )}

        {user && (
          <NavLink to="/dashboard" onClick={close}>
            Dashboard
          </NavLink>
        )}

        {user && (
          <NavLink to="/claims" onClick={close}>
            My Claims
          </NavLink>
        )}

        {user?.role === 'moderator' && (
          <NavLink to="/moderator" onClick={close} className="nav-admin-link">
            <ShieldCheck size={16} />
            <span>Moderator Tools</span>
          </NavLink>
        )}

        {!user ? (
          <div className="nav-auth-actions">
            <NavLink className="button secondary small" to="/login" onClick={close}>
              Log in
            </NavLink>
            <NavLink className="button primary small" to="/register" onClick={close}>
              Register
            </NavLink>
          </div>
        ) : (
          <div className="nav-user-session">
            <div className="user-pill">
              {user.role === 'moderator' ? (
                <ShieldCheck size={14} className="user-icon mod" />
              ) : (
                <User size={14} className="user-icon" />
              )}
              <span className="user-name">{user.name}</span>
              {user.role === 'moderator' && <span className="admin-chip">Staff</span>}
            </div>
            <button className="button secondary small logout-btn" onClick={signOut}>
              Log out
            </button>
          </div>
        )}
      </nav>
    </header>
  );
}

import React from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';

const AppShell: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const canSeeAccounts = user?.role === 'SUPER_ADMIN' || user?.role === 'TPO' || user?.role === 'HOD';

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="sidebar-brand">Placement CRM</div>
          <nav className="sidebar-nav" aria-label="Primary">
            <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}>
              Dashboard
            </NavLink>
            {canSeeAccounts && (
              <NavLink to="/accounts" className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}>
                Accounts
              </NavLink>
            )}
          </nav>
        </div>
        <button type="button" className="btn-secondary sidebar-logout" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <input
            className="global-search"
            type="text"
            placeholder="Search students, companies, jobs..."
            aria-label="Global search"
          />
          <div className="topbar-actions">
            <button type="button" className="btn-secondary">Notifications</button>
            <Link className="profile-chip profile-link" to="/profile">
              {user?.username || 'Profile'}
            </Link>
          </div>
        </header>

        <main className="workspace-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppShell;

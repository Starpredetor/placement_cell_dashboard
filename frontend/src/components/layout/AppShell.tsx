import React from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';

const AppShell: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Super Admin';
      case 'TPO':
        return 'TPO Admin';
      case 'HOD':
        return 'HOD Faculty';
      case 'VOLUNTEER':
        return 'Volunteer';
      case 'STUDENT':
        return 'Student';
      default:
        return role;
    }
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="sidebar-brand-wrapper">
            <div className="sidebar-brand">Placement CRM</div>
            <div className="sidebar-subtitle">
              <span>
                {user?.first_name} {user?.last_name}
              </span>
              <span className="sidebar-role-badge">{getRoleLabel(user?.role || '')}</span>
            </div>
          </div>

          <nav className="sidebar-nav" aria-label="Primary">
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}
            >
              Dashboard
            </NavLink>

            {/* STUDENTS Navigation */}
            {user?.role === 'STUDENT' && (
              <>
                <NavLink
                  to="/profile"
                  className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}
                >
                  My Profile
                </NavLink>
                <NavLink
                  to="/placements"
                  className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}
                >
                  Placement
                </NavLink>
                <NavLink
                  to="/training"
                  className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}
                >
                  Training
                </NavLink>
                <NavLink
                  to="/events"
                  className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}
                >
                  Seminars & Events
                </NavLink>
              </>
            )}

            {/* VOLUNTEER Navigation */}
            {user?.role === 'VOLUNTEER' && (
              <>
                <NavLink
                  to="/students"
                  className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}
                >
                  Students Directory
                </NavLink>
                <NavLink
                  to="/placements"
                  className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}
                >
                  Placement Attendance
                </NavLink>
                <NavLink
                  to="/training"
                  className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}
                >
                  Training Attendance
                </NavLink>
                <NavLink
                  to="/events"
                  className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}
                >
                  Event Attendance
                </NavLink>
              </>
            )}

            {/* FACULTY / ADMIN Navigation */}
            {(user?.role === 'SUPER_ADMIN' ||
              user?.role === 'TPO' ||
              user?.role === 'HOD') && (
              <>
                <NavLink
                  to="/students"
                  className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}
                >
                  Students Directory
                </NavLink>
                <NavLink
                  to="/placements"
                  className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}
                >
                  Placement Ops
                </NavLink>
                <NavLink
                  to="/training"
                  className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}
                >
                  Training Planner
                </NavLink>
                <NavLink
                  to="/events"
                  className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}
                >
                  Events & Seminars
                </NavLink>
                <NavLink
                  to="/accounts"
                  className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}
                >
                  Data & Access Control
                </NavLink>
              </>
            )}
          </nav>
        </div>

        <div>
          <button
            type="button"
            className="btn-secondary sidebar-logout"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div style={{ flex: 1 }} /> {/* Spacer to preserve header layout */}
          <div className="topbar-actions">
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: '8px 12px' }}
            >
              Notifications
            </button>
            <Link className="profile-chip profile-link" to="/profile">
              {user?.username || 'Profile'}
            </Link>
            <button
              type="button"
              className="btn-secondary"
              style={{
                padding: '8px 12px',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#F87171',
                border: '1px solid rgba(239, 68, 68, 0.15)',
                fontWeight: '600',
                fontSize: '12.5px',
              }}
              onClick={handleLogout}
            >
              Logout
            </button>
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

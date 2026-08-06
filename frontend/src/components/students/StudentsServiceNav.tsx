import React from 'react';
import { Link, NavLink } from 'react-router-dom';

type StudentsServiceNavProps = {
  studentId?: number;
};

const StudentsServiceNav: React.FC<StudentsServiceNavProps> = ({ studentId }) => (
  <aside className="service-nav" aria-label="Students module">
    <strong>Students</strong>
    <NavLink
      to="/students"
      end
      className={({ isActive }) => `service-nav-link ${isActive ? 'is-active' : ''}`}
    >
      Directory
    </NavLink>
    {studentId ? (
      <>
        <NavLink
          to={`/students/${studentId}`}
          end
          className={({ isActive }) => `service-nav-link ${isActive ? 'is-active' : ''}`}
        >
          Profile
        </NavLink>
        <NavLink
          to={`/students/${studentId}/edit`}
          className={({ isActive }) => `service-nav-link ${isActive ? 'is-active' : ''}`}
        >
          Edit Details
        </NavLink>
      </>
    ) : (
      <>
        <span className="service-nav-link is-disabled">Profile</span>
        <span className="service-nav-link is-disabled">Edit Details</span>
      </>
    )}
    <span className="service-nav-link is-disabled">Documents</span>
    <span className="service-nav-link is-disabled">Placement Activity</span>
    <span className="service-nav-link is-disabled">Training Activity</span>
    <Link className="service-nav-secondary" to="/dashboard">
      Back to CRM services
    </Link>
  </aside>
);

export default StudentsServiceNav;

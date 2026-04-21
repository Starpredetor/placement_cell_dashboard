import React from 'react';

import { useAuth } from '../context/AuthContext';

type RoleFocus = {
  title: string;
  description: string;
  actions: string[];
};

const roleFocusMap: Record<string, RoleFocus> = {
  TPO: {
    title: 'TPO Focus',
    description: 'Track placements, company pipeline, and execution bottlenecks.',
    actions: ['Review today\'s opportunities', 'Publish pending company openings', 'Check round progression'],
  },
  HOD: {
    title: 'HOD Focus',
    description: 'Monitor department performance and placement outcomes.',
    actions: ['Review branch-wise placement rates', 'Check training performance trend', 'Escalate low-attendance cohorts'],
  },
  STUDENT: {
    title: 'Student Focus',
    description: 'Stay on track with opportunities, profile readiness, and progress.',
    actions: ['Complete profile information', 'Apply to eligible opportunities', 'Track application status'],
  },
};

const defaultFocus: RoleFocus = {
  title: 'Operations Focus',
  description: 'Use dashboards to move from data to decisions quickly.',
  actions: ['Review pending approvals', 'Verify data quality', 'Follow up on key alerts'],
};

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const focus = roleFocusMap[user?.role ?? ''] || defaultFocus;

  return (
    <div>
      <section className="page-header">
        <div>
          <h1>CRM Overview</h1>
          <p>{focus.description}</p>
        </div>
        <button type="button" className="btn-primary">New Action</button>
      </section>

      <section className="kpi-grid" aria-label="KPI cards">
        <article className="card kpi-card">
          <span className="kpi-label">Total Students</span>
          <strong className="kpi-value">1,248</strong>
          <span className="kpi-meta">+4.2% this month</span>
        </article>
        <article className="card kpi-card">
          <span className="kpi-label">Placement Rate</span>
          <strong className="kpi-value">74%</strong>
          <span className="kpi-meta">+6% vs last cycle</span>
        </article>
        <article className="card kpi-card">
          <span className="kpi-label">Active Companies</span>
          <strong className="kpi-value">36</strong>
          <span className="kpi-meta">8 in pipeline</span>
        </article>
        <article className="card kpi-card">
          <span className="kpi-label">Open Opportunities</span>
          <strong className="kpi-value">19</strong>
          <span className="kpi-meta">5 closing this week</span>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="card">
          <h2>{focus.title}</h2>
          <p className="text-secondary">Action-first checklist</p>
          <ul className="action-list">
            {focus.actions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
        </article>

        <article className="card">
          <h2>Placement Trend</h2>
          <div className="chart-placeholder">Line chart placeholder</div>
        </article>

        <article className="card">
          <h2>Attendance Trend</h2>
          <div className="chart-placeholder">Bar chart placeholder</div>
        </article>

        <article className="card">
          <h2>What Next</h2>
          <div className="quick-actions">
            <button type="button" className="btn-secondary">Open Opportunities</button>
            <button type="button" className="btn-secondary">Review Analytics</button>
            <button type="button" className="btn-success">Run Daily Summary</button>
          </div>
        </article>
      </section>
    </div>
  );
};

export default DashboardPage;

import React from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  // 1. STUDENT VIEW
  const renderStudentDashboard = () => {
    return (
      <div style={{ display: 'grid', gap: 'var(--space-lg)' }}>
        <section className="page-header">
          <div>
            <h1>Student Portal</h1>
            <p className="text-secondary">Welcome back, {user?.first_name}. Track your placement readiness, schedules, and active opportunities.</p>
          </div>
          <Link to="/profile" className="btn-primary button-link">View My Profile</Link>
        </section>

        {/* KPIs */}
        <section className="kpi-grid" aria-label="Student KPIs" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <article className="card kpi-card">
            <span className="kpi-label">Applied Jobs</span>
            <strong className="kpi-value">2</strong>
            <span className="kpi-meta">Last application: Yesterday</span>
          </article>
          <article className="card kpi-card">
            <span className="kpi-label">Ongoing Trainings</span>
            <strong className="kpi-value">1</strong>
            <span className="kpi-meta">Aptitude & Verbal Prep</span>
          </article>
          <article className="card kpi-card">
            <span className="kpi-label">Training Attendance</span>
            <strong className="kpi-value">92%</strong>
            <span className="kpi-meta">Required: Min 85%</span>
          </article>
        </section>

        <section className="dashboard-grid">
          {/* Readiness Tracker */}
          <article className="card" style={{ display: 'grid', gap: '12px' }}>
            <h2>Profile & Resume Readiness</h2>
            <p className="text-secondary">Complete all checklist items to be eligible for campus recruitments.</p>
            
            <div className="circular-progress-wrapper" style={{ margin: '14px 0' }}>
              <svg viewBox="0 0 36 36" className="circular-chart" style={{ width: '100px', height: '100px' }}>
                <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="circle circle-success" strokeDasharray="80, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <text x="18" y="20.35" className="percentage">80%</text>
              </svg>
              <div>
                <h3 style={{ margin: '0 0 4px 0' }}>Excellent Progress!</h3>
                <p className="text-secondary" style={{ fontSize: '13px', margin: 0 }}>
                  Your academic records and grades are verified. Upload your latest resume to reach 100% readiness and unlock applications.
                </p>
              </div>
            </div>

            <ul className="action-list">
              <li style={{ borderLeftColor: 'var(--color-accent)' }}>Academic Grades verified by HOD</li>
              <li style={{ borderLeftColor: 'var(--color-accent)' }}>Compliance documents (Aadhaar/PAN) uploaded</li>
              <li style={{ borderLeftColor: 'var(--color-warning)' }}>Upload latest professional resume (PDF format)</li>
            </ul>
          </article>

          {/* Quick Actions */}
          <article className="card" style={{ display: 'grid', gap: '12px', alignContent: 'start' }}>
            <h2>Quick Actions</h2>
            <p className="text-secondary">Jump directly to your active portal workspaces.</p>
            <div style={{ display: 'grid', gap: '10px' }}>
              <Link to="/placements" className="btn-primary button-link" style={{ justifyContent: 'center' }}>Browse Active Jobs</Link>
              <Link to="/profile" className="btn-secondary button-link" style={{ justifyContent: 'center' }}>Upload Resume File</Link>
              <Link to="/training" className="btn-secondary button-link" style={{ justifyContent: 'center' }}>Check Training Slots</Link>
            </div>
          </article>
        </section>
      </div>
    );
  };

  // 2. VOLUNTEER VIEW
  const renderVolunteerDashboard = () => {
    return (
      <div style={{ display: 'grid', gap: 'var(--space-lg)' }}>
        <section className="page-header">
          <div>
            <h1>Volunteer Hub</h1>
            <p className="text-secondary">Track student records, verify document collection lists, and manage turnout rosters.</p>
          </div>
          <Link to="/students" className="btn-primary button-link">Search Student Directory</Link>
        </section>

        {/* KPIs */}
        <section className="kpi-grid" aria-label="Volunteer KPIs">
          <article className="card kpi-card">
            <span className="kpi-label">Active Student Records</span>
            <strong className="kpi-value">1,248</strong>
            <span className="kpi-meta">All branches & batches</span>
          </article>
          <article className="card kpi-card">
            <span className="kpi-label">Pending Attendances</span>
            <strong className="kpi-value">2</strong>
            <span className="kpi-meta">Slots requiring rosters today</span>
          </article>
          <article className="card kpi-card">
            <span className="kpi-label">Resumes Collected</span>
            <strong className="kpi-value">312</strong>
            <span className="kpi-meta">Uploads via helper portal</span>
          </article>
          <article className="card kpi-card">
            <span className="kpi-label">TPO Tasks Completed</span>
            <strong className="kpi-value">14</strong>
            <span className="kpi-meta">Weekly progress target</span>
          </article>
        </section>

        <section className="dashboard-grid">
          {/* Volunteer Todo List */}
          <article className="card">
            <h2>Today's Coordination Checklist</h2>
            <p className="text-secondary">Tasks assigned by the Training & Placement Officer (TPO).</p>
            <ul className="action-list" style={{ marginTop: '14px' }}>
              <li>Mark attendance for Aptitude Training Slot (Batch B) at 2:00 PM</li>
              <li>Collect resumes of pending CSE students for Graduate Engineer recruitment</li>
              <li>Verify that Aadhaar/PAN compliance documents are updated on student profiles</li>
              <li>Assistance roster: Prepare event announcement cards for upcoming Google Seminar</li>
            </ul>
          </article>

          {/* Quick Shortcuts */}
          <article className="card" style={{ alignContent: 'start', display: 'grid', gap: '12px' }}>
            <h2>Operational Shortcuts</h2>
            <p className="text-secondary">Direct links to take class or company lists attendance.</p>
            <div style={{ display: 'grid', gap: '10px' }}>
              <Link to="/training" className="btn-primary button-link" style={{ justifyContent: 'center' }}>Take Training Attendance</Link>
              <Link to="/placements" className="btn-secondary button-link" style={{ justifyContent: 'center' }}>Mark Job Day Attendance</Link>
              <Link to="/students" className="btn-secondary button-link" style={{ justifyContent: 'center' }}>Upload Student Resumes</Link>
            </div>
          </article>
        </section>
      </div>
    );
  };

  // 3. FACULTY / TPO / ADMIN VIEW
  const renderAdminDashboard = () => {
    return (
      <div style={{ display: 'grid', gap: 'var(--space-lg)' }}>
        <section className="page-header">
          <div>
            <h1>CRM Operations</h1>
            <p className="text-secondary">Overview of placement funnels, campus training benchmarks, and student statistics.</p>
          </div>
          <div className="quick-actions">
            <Link to="/students" className="btn-primary button-link">Add New Student</Link>
            <Link to="/placements" className="btn-success button-link">Create Job Opening</Link>
          </div>
        </section>

        {/* KPIs */}
        <section className="kpi-grid" aria-label="TPO Operations KPIs">
          <article className="card kpi-card">
            <span className="kpi-label">Total Student Cohort</span>
            <strong className="kpi-value">1,248</strong>
            <span className="kpi-meta">+4.2% admission growth</span>
          </article>
          <article className="card kpi-card">
            <span className="kpi-label">Placement Rate</span>
            <strong className="kpi-value">74%</strong>
            <span className="kpi-meta">+6% vs previous cycle</span>
          </article>
          <article className="card kpi-card">
            <span className="kpi-label">Active Corporate Partners</span>
            <strong className="kpi-value">36</strong>
            <span className="kpi-meta">8 in discussion pipeline</span>
          </article>
          <article className="card kpi-card">
            <span className="kpi-label">Open Opportunities</span>
            <strong className="kpi-value">19</strong>
            <span className="kpi-meta">5 drives closing this week</span>
          </article>
        </section>

        {/* Analytics Charts */}
        <section className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <article className="card">
            <h2>Branch Placement Ratios</h2>
            <p className="text-secondary" style={{ marginBottom: '16px' }}>Percentage of registered student batch placed by branch.</p>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px', fontWeight: 'bold' }}>
                  <span>Computer Engineering (CE)</span>
                  <span>91% (280/308 students)</span>
                </div>
                <div style={{ height: '8px', background: 'var(--color-slate-100)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '91%', background: 'var(--color-primary)', borderRadius: '4px' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px', fontWeight: 'bold' }}>
                  <span>Information Technology (IT)</span>
                  <span>88% (120/136 students)</span>
                </div>
                <div style={{ height: '8px', background: 'var(--color-slate-100)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '88%', background: 'var(--color-primary)', borderRadius: '4px' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px', fontWeight: 'bold' }}>
                  <span>Electronics and Telecommunications (EXTC)</span>
                  <span>72% (150/208 students)</span>
                </div>
                <div style={{ height: '8px', background: 'var(--color-slate-100)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '72%', background: 'var(--color-primary-light)', borderRadius: '4px' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px', fontWeight: 'bold' }}>
                  <span>Computer Science Business Systems (CSBS)</span>
                  <span>54% (98/181 students)</span>
                </div>
                <div style={{ height: '8px', background: 'var(--color-slate-100)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '54%', background: 'var(--color-slate-400)', borderRadius: '4px' }} />
                </div>
              </div>
            </div>
          </article>

          <article className="card">
            <h2>Weekly Preparation Attendance</h2>
            <p className="text-secondary" style={{ marginBottom: '16px' }}>Student turnout trends for soft skills training.</p>
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '150px', paddingTop: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '30px' }}>
                <div style={{ height: '110px', width: '100%', background: 'var(--color-accent)', borderRadius: '4px 4px 0 0', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', color: 'white', fontSize: '10px', fontWeight: 'bold', paddingTop: '4px' }}>92%</div>
                <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-slate-500)' }}>W1</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '30px' }}>
                <div style={{ height: '100px', width: '100%', background: 'var(--color-accent)', borderRadius: '4px 4px 0 0', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', color: 'white', fontSize: '10px', fontWeight: 'bold', paddingTop: '4px' }}>85%</div>
                <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-slate-500)' }}>W2</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '30px' }}>
                <div style={{ height: '70px', width: '100%', background: 'var(--color-primary-light)', borderRadius: '4px 4px 0 0', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', color: 'white', fontSize: '10px', fontWeight: 'bold', paddingTop: '4px' }}>62%</div>
                <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-slate-500)' }}>W3</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '30px' }}>
                <div style={{ height: '105px', width: '100%', background: 'var(--color-accent)', borderRadius: '4px 4px 0 0', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', color: 'white', fontSize: '10px', fontWeight: 'bold', paddingTop: '4px' }}>88%</div>
                <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-slate-500)' }}>W4</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '30px' }}>
                <div style={{ height: '115px', width: '100%', background: 'var(--color-accent)', borderRadius: '4px 4px 0 0', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', color: 'white', fontSize: '10px', fontWeight: 'bold', paddingTop: '4px' }}>96%</div>
                <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-slate-500)' }}>W5</span>
              </div>
            </div>
          </article>
        </section>

        <section className="dashboard-grid">
          {/* Operations focus list */}
          <article className="card">
            <h2>Critical Action Roster</h2>
            <p className="text-secondary">Administrative tasks awaiting review or execution.</p>
            <ul className="action-list" style={{ marginTop: '14px' }}>
              <li>Approve pending student registrations (14 profiles outstanding)</li>
              <li>Publish final eligibility list for Microsoft campus recruitment drive</li>
              <li>Export student GPA rosters for TCS drive HR presentation</li>
              <li>Schedule next weeks mock interview sessions (TPO coordinated)</li>
            </ul>
          </article>

          {/* Quick Shortcuts */}
          <article className="card" style={{ alignContent: 'start', display: 'grid', gap: '12px' }}>
            <h2>Operations Shortcuts</h2>
            <p className="text-secondary">Direct routes to management views.</p>
            <div style={{ display: 'grid', gap: '10px' }}>
              <Link to="/students" className="btn-primary button-link" style={{ justifyContent: 'center' }}>Manage Student Profiles</Link>
              <Link to="/placements" className="btn-success button-link" style={{ justifyContent: 'center' }}>Manage Active Openings</Link>
              <Link to="/accounts" className="btn-secondary button-link" style={{ justifyContent: 'center' }}>Edit Users & Roles</Link>
            </div>
          </article>
        </section>
      </div>
    );
  };

  if (user?.role === 'STUDENT') {
    return renderStudentDashboard();
  } else if (user?.role === 'VOLUNTEER') {
    return renderVolunteerDashboard();
  } else {
    return renderAdminDashboard();
  }
};

export default DashboardPage;

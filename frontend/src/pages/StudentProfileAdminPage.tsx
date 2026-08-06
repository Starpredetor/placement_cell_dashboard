import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '../lib/legacyQuery';

import StudentsServiceNav from '../components/students/StudentsServiceNav';
import { useAuth } from '../context/AuthContext';
import { StudentProfile, studentsAPI } from '../services/api';
import {
  getResumeForStudent,
  saveResumeForStudent,
  deleteResumeForStudent,
} from './ProfilePage';

type ProfileTab =
  'overview' | 'academics' | 'placement' | 'training' | 'documents' | 'compliance';

const displayValue = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === '') {
    return 'Not provided';
  }
  return value;
};

const StudentProfileAdminPage: React.FC = () => {
  const { user } = useAuth();
  const params = useParams();
  const studentId = Number(params.studentId);
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const canManageStudents =
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'TPO' ||
    user?.role === 'HOD' ||
    user?.role === 'VOLUNTEER';

  // Resume State
  const [uploadedResume, setUploadedResume] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);

  const studentQuery = useQuery(
    ['student-detail', studentId],
    async () => {
      const response = await studentsAPI.detail(studentId);
      return response.data;
    },
    {
      enabled: canManageStudents && Number.isFinite(studentId),
      onSuccess: (data) => {
        if (data?.id) {
          setUploadedResume(getResumeForStudent(data.id));
        }
      },
    },
  );

  const student = studentQuery.data;

  // Sync resume when student changes
  useEffect(() => {
    if (student?.id) {
      setUploadedResume(getResumeForStudent(student.id));
    }
  }, [student]);

  const handleResumeUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !student?.id) return;

    setIsUploading(true);
    setTimeout(() => {
      const sizeStr = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
      saveResumeForStudent(student.id, file.name, sizeStr);
      setUploadedResume(getResumeForStudent(student.id));
      setIsUploading(false);
      alert('Resume file uploaded successfully!');
    }, 1000);
  };

  const handleResumeDelete = () => {
    if (
      !student?.id ||
      !window.confirm("Are you sure you want to delete this student's uploaded resume?")
    )
      return;
    deleteResumeForStudent(student.id);
    setUploadedResume(null);
  };

  if (!canManageStudents) {
    return (
      <article className="card access-denied">
        <h2>Student Management Unavailable</h2>
        <p className="text-secondary">
          Student profile management is available for authorized roles only.
        </p>
        <Link className="btn-primary button-link" to="/dashboard">
          Back to Dashboard
        </Link>
      </article>
    );
  }

  // Statistics cards data
  const getStudentStats = (s: StudentProfile) => [
    {
      label: 'Academic Year',
      value: s.current_academic_year,
      meta: `Admission ${s.admission_year}`,
    },
    {
      label: 'Expected Graduation',
      value: s.expected_graduation_year,
      meta: s.entry_mode === 'LATERAL_DIPLOMA' ? 'Lateral Diploma' : 'Regular Track',
    },
    {
      label: 'Cumulative Grades',
      value: s.academic_history?.se_cgpi || 'N/A',
      meta: `${s.academic_history?.live_kt ?? 0} Live / ${s.academic_history?.dead_kt ?? 0} Dead KTs`,
    },
    {
      label: 'Resume Document',
      value: uploadedResume ? 'Available' : 'Pending',
      meta: uploadedResume ? uploadedResume.filename : 'No resume file uploaded',
    },
  ];

  return (
    <main className="service-layout">
      <StudentsServiceNav studentId={studentId} />

      <section className="service-content">
        {studentQuery.isLoading && (
          <article className="card">Loading student profile...</article>
        )}
        {studentQuery.isError && (
          <article className="card form-error">
            Could not load this student profile.
          </article>
        )}

        {student && (
          <div style={{ display: 'grid', gap: 'var(--space-lg)' }}>
            {/* HERO PANEL */}
            <section
              className="student-profile-hero"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <p className="service-eyebrow">Student details page</p>
                <h1 style={{ margin: 0 }}>{student.full_name}</h1>
                <p className="text-secondary" style={{ margin: '4px 0 0' }}>
                  {student.college_roll_no} | {student.branch} | {student.batch}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Link
                  className="btn-primary button-link"
                  to={`/students/${student.id}/edit`}
                >
                  Edit Profile
                </Link>
                <Link className="btn-secondary button-link" to="/students">
                  Directory
                </Link>
              </div>
            </section>

            {/* KPI STATS CARD GRID */}
            <section className="student-stat-grid" aria-label="Student stats">
              {getStudentStats(student).map((stat) => (
                <article className="card kpi-card student-stat-card" key={stat.label}>
                  <span className="kpi-label">{stat.label}</span>
                  <strong className="kpi-value" style={{ fontSize: '22px' }}>
                    {stat.value}
                  </strong>
                  <span className="kpi-meta">{stat.meta}</span>
                </article>
              ))}
            </section>

            {/* MAIN TAB COMPONENT */}
            <section className="card student-profile-workspace">
              <div
                className="workspace-tabs"
                role="tablist"
                aria-label="Student profile sections"
              >
                {[
                  ['overview', 'Overview Details'],
                  ['academics', 'Academics & KT'],
                  ['documents', 'Uploaded Documents'],
                  ['placement', 'Job Applications'],
                  ['training', 'Prep Classes'],
                  ['compliance', 'Compliance Records'],
                ].map(([tabId, label]) => (
                  <button
                    key={tabId}
                    type="button"
                    className={`workspace-tab ${activeTab === tabId ? 'is-active' : ''}`}
                    onClick={() => setActiveTab(tabId as ProfileTab)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* OVERVIEW PANEL */}
              {activeTab === 'overview' && (
                <section className="tab-panel">
                  <h2>Profile Overview</h2>
                  <div className="profile-detail-grid">
                    <span>
                      <strong>Full Student Name</strong>
                      {student.full_name}
                    </span>
                    <span>
                      <strong>Email Address</strong>
                      {student.email}
                    </span>
                    <span>
                      <strong>College Roll No</strong>
                      {student.college_roll_no}
                    </span>
                    <span>
                      <strong>Branch & Major Subject</strong>
                      {student.branch} ({displayValue(student.major_minor_subject)})
                    </span>
                    <span>
                      <strong>Division / Batch</strong>
                      {student.division} / {student.batch}
                    </span>
                    <span>
                      <strong>Student WhatsApp</strong>
                      {displayValue(student.student_whatsapp_number)}
                    </span>
                    <span>
                      <strong>Parent WhatsApp Contact</strong>
                      {displayValue(student.parent_whatsapp_number)}
                    </span>
                    <span>
                      <strong>Residential Address City</strong>
                      {displayValue(student.residential_city)}
                    </span>
                  </div>
                </section>
              )}

              {/* ACADEMICS PANEL */}
              {activeTab === 'academics' && (
                <section className="tab-panel">
                  <h2>Academic History Details</h2>
                  <div className="profile-detail-grid">
                    <span>
                      <strong>10th Passing %</strong>
                      {displayValue(student.academic_history?.tenth_percentage)}% (
                      {displayValue(student.academic_history?.tenth_board)})
                    </span>
                    <span>
                      <strong>12th / Diploma %</strong>
                      {displayValue(
                        student.academic_history?.twelfth_or_diploma_percentage,
                      )}
                      % ({displayValue(student.academic_history?.twelfth_or_diploma_type)}
                      )
                    </span>
                    <span>
                      <strong>BTech Cumulative CGPI</strong>
                      <strong
                        style={{
                          color: 'var(--color-primary)',
                          display: 'block',
                          fontSize: '15px',
                        }}
                      >
                        {displayValue(student.academic_history?.se_cgpi)} CGPI
                      </strong>
                    </span>
                    <span>
                      <strong>Backlogs (KTs)</strong>
                      <span
                        style={{
                          color: student.academic_history?.live_kt
                            ? 'var(--color-error)'
                            : 'var(--color-accent)',
                          fontWeight: 'bold',
                        }}
                      >
                        {student.academic_history?.live_kt ?? 0} Live KTs /{' '}
                        {student.academic_history?.dead_kt ?? 0} Dead KTs
                      </span>
                    </span>
                    <div
                      className="form-group-wide"
                      style={{
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        padding: '14px',
                        background: '#F8FAFC',
                      }}
                    >
                      <strong>Courses & Certifications Done</strong>
                      <p
                        style={{
                          margin: '4px 0 0',
                          color: 'var(--color-slate-600)',
                          fontSize: '13px',
                        }}
                      >
                        {displayValue(student.academic_history?.courses_done_text)}
                      </p>
                    </div>
                    <div
                      className="form-group-wide"
                      style={{
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        padding: '14px',
                        background: '#F8FAFC',
                      }}
                    >
                      <strong>Completed Internships</strong>
                      <p
                        style={{
                          margin: '4px 0 0',
                          color: 'var(--color-slate-600)',
                          fontSize: '13px',
                        }}
                      >
                        {displayValue(student.academic_history?.internships_text)}
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {/* DOCUMENTS PANEL */}
              {activeTab === 'documents' && (
                <section className="tab-panel">
                  <h2>Uploaded Documents</h2>
                  <p className="text-secondary">
                    Helper Role: Upload or verify student resumes here. Resumes uploaded
                    will be compiled automatically in the TPO job opportunities roster
                    Excel files.
                  </p>

                  <div style={{ display: 'grid', gap: '14px', margin: '14px 0' }}>
                    {uploadedResume ? (
                      <div
                        className="document-row"
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '16px',
                          background: '#F8FAFC',
                        }}
                      >
                        <div>
                          <strong
                            style={{ color: 'var(--color-slate-900)', display: 'block' }}
                          >
                            {uploadedResume.filename}
                          </strong>
                          <span className="table-subtext">
                            Size: {uploadedResume.size} | Uploaded:{' '}
                            {uploadedResume.uploadedAt}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <a
                            href="#"
                            className="btn-secondary button-link"
                            style={{ padding: '8px 14px' }}
                            onClick={(e) => {
                              e.preventDefault();
                              alert(`Downloading file: ${uploadedResume.filename}`);
                            }}
                          >
                            Download
                          </a>
                          <button
                            type="button"
                            className="btn-danger"
                            style={{ padding: '8px 14px' }}
                            onClick={handleResumeDelete}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="empty-module-state"
                        style={{ display: 'grid', justifyItems: 'center', gap: '8px' }}
                      >
                        <strong>No resume uploaded</strong>
                        <p className="text-secondary" style={{ fontSize: '13px' }}>
                          Upload a dummy resume PDF for this student.
                        </p>

                        <label
                          className="btn-primary"
                          style={{
                            padding: '10px 20px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                          }}
                        >
                          Upload Student Resume
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            style={{ display: 'none' }}
                            onChange={handleResumeUpload}
                            disabled={isUploading}
                          />
                        </label>
                        {isUploading && (
                          <span
                            style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}
                          >
                            Uploading document...
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* PLACEMENT TAB (Simulated) */}
              {activeTab === 'placement' && (
                <section className="tab-panel">
                  <h2>Placement activity</h2>
                  <div
                    className="empty-module-state"
                    style={{
                      background: '#FAF6F6',
                      borderColor: 'rgba(139, 30, 30, 0.15)',
                    }}
                  >
                    <strong>Job Application Funnel: Qualified</strong>
                    <p
                      className="text-secondary"
                      style={{ fontSize: '13px', margin: '4px 0 12px' }}
                    >
                      Student is currently active in the following placement opportunies.
                    </p>
                    <div
                      style={{
                        display: 'grid',
                        gap: '8px',
                        textAlign: 'left',
                        maxWidth: '520px',
                        margin: '0 auto',
                      }}
                    >
                      <div
                        style={{
                          padding: '10px',
                          border: '1px solid var(--color-border)',
                          borderRadius: '6px',
                          background: 'white',
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>
                          <strong>Graduate Engineer Trainee</strong> at StartupX
                        </span>
                        <span
                          className="badge badge-eligible"
                          style={{ fontSize: '10px' }}
                        >
                          HR Round
                        </span>
                      </div>
                      <div
                        style={{
                          padding: '10px',
                          border: '1px solid var(--color-border)',
                          borderRadius: '6px',
                          background: 'white',
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>
                          <strong>Software Analyst</strong> at BigCorp
                        </span>
                        <span
                          className="badge badge-applied"
                          style={{
                            fontSize: '10px',
                            background: 'rgba(100, 116, 139, 0.1)',
                            color: 'var(--color-slate-600)',
                          }}
                        >
                          Aptitude qualified
                        </span>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* TRAINING TAB (Simulated) */}
              {activeTab === 'training' && (
                <section className="tab-panel">
                  <h2>Training Preparation logs</h2>
                  <div className="empty-module-state">
                    <strong>Weekly Skills Roster: 92% Turnout</strong>
                    <p
                      className="text-secondary"
                      style={{ fontSize: '13px', margin: '4px 0 12px' }}
                    >
                      Attendance logs and test scores for Prep sessions.
                    </p>
                    <div
                      style={{
                        display: 'grid',
                        gap: '8px',
                        textAlign: 'left',
                        maxWidth: '520px',
                        margin: '0 auto',
                      }}
                    >
                      <div
                        style={{
                          padding: '10px',
                          border: '1px solid var(--color-border)',
                          borderRadius: '6px',
                          background: 'white',
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>Aptitude Foundation Class (Slot W1)</span>
                        <span
                          style={{ color: 'var(--color-accent)', fontWeight: 'bold' }}
                        >
                          Present
                        </span>
                      </div>
                      <div
                        style={{
                          padding: '10px',
                          border: '1px solid var(--color-border)',
                          borderRadius: '6px',
                          background: 'white',
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>Interview Prep & Mock (Slot W2)</span>
                        <span
                          style={{ color: 'var(--color-accent)', fontWeight: 'bold' }}
                        >
                          Present
                        </span>
                      </div>
                      <div
                        style={{
                          padding: '10px',
                          border: '1px solid var(--color-border)',
                          borderRadius: '6px',
                          background: 'white',
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>Mock Test Score</span>
                        <span>
                          <strong>88 / 100 Marks</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* COMPLIANCE PANEL */}
              {activeTab === 'compliance' && (
                <section className="tab-panel">
                  <h2>Compliance & Residential details</h2>
                  <div className="profile-detail-grid">
                    <span>
                      <strong>Aadhaar Number</strong>
                      <code>{displayValue(student.compliance?.aadhaar_number)}</code>
                    </span>
                    <span>
                      <strong>PAN Number</strong>
                      <code>{displayValue(student.compliance?.pan_number)}</code>
                    </span>
                    <span>
                      <strong>Parent Email Address</strong>
                      {displayValue(student.parent_email)}
                    </span>
                    <span>
                      <strong>Full Residential Address</strong>
                      {displayValue(student.residential_address)},{' '}
                      {student.residential_city} ({displayValue(student.pin_code)})
                    </span>
                  </div>
                </section>
              )}
            </section>
          </div>
        )}
      </section>
    </main>
  );
};

export default StudentProfileAdminPage;

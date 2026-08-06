import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from '../lib/legacyQuery';

import { useAuth } from '../context/AuthContext';
import { authAPI, StudentProfile, studentsAPI } from '../services/api';

type ProfileFormValues = {
  username: string;
  first_name: string;
  last_name: string;
};

type PasswordFormValues = {
  current_password: string;
  new_password: string;
  confirm_password: string;
};

type ProfileTab = 'overview' | 'academics' | 'documents' | 'compliance';

const displayValue = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === '') {
    return 'Not provided';
  }
  return value;
};

// Resume mock database helper using localStorage
export const getResumeForStudent = (studentId: number) => {
  try {
    const resumes = localStorage.getItem('placement_crm_resumes');
    if (resumes) {
      const parsed = JSON.parse(resumes);
      return parsed[studentId] || null;
    }
  } catch (e) {
    console.error('Error reading resumes', e);
  }
  return null;
};

export const saveResumeForStudent = (
  studentId: number,
  filename: string,
  size: string,
) => {
  try {
    const resumes = localStorage.getItem('placement_crm_resumes') || '{}';
    const parsed = JSON.parse(resumes);
    parsed[studentId] = {
      filename,
      size,
      uploadedAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    localStorage.setItem('placement_crm_resumes', JSON.stringify(parsed));
  } catch (e) {
    console.error('Error saving resume', e);
  }
};

export const deleteResumeForStudent = (studentId: number) => {
  try {
    const resumes = localStorage.getItem('placement_crm_resumes');
    if (resumes) {
      const parsed = JSON.parse(resumes);
      delete parsed[studentId];
      localStorage.setItem('placement_crm_resumes', JSON.stringify(parsed));
    }
  } catch (e) {
    console.error('Error deleting resume', e);
  }
};

const ProfilePage: React.FC = () => {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const [profileMessage, setProfileMessage] = useState<string>('');
  const [passwordMessage, setPasswordMessage] = useState<string>('');
  const [profileError, setProfileError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');

  // Resume Upload State
  const [uploadedResume, setUploadedResume] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);

  const studentProfileQuery = useQuery(
    ['student-profile-me'],
    async () => {
      const response = await studentsAPI.me();
      return response.data;
    },
    {
      enabled: user?.role === 'STUDENT',
      retry: false,
      onSuccess: (data) => {
        if (data?.id) {
          setUploadedResume(getResumeForStudent(data.id));
        }
      },
    },
  );

  const student = studentProfileQuery.data;

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { isSubmitting: isSubmittingProfile },
  } = useForm<ProfileFormValues>({
    defaultValues: {
      username: user?.username || '',
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPasswordForm,
    formState: { isSubmitting: isSubmittingPassword },
  } = useForm<PasswordFormValues>();

  const onSubmitProfile = async (data: ProfileFormValues) => {
    setProfileMessage('');
    setProfileError('');

    try {
      const response = await authAPI.updateMe(data);
      setUser(response.data);
      setProfileMessage('Account details updated successfully.');
    } catch (error: any) {
      const backendMessage =
        error?.response?.data?.username?.[0] || error?.response?.data?.detail;
      setProfileError(backendMessage || 'Unable to update account details.');
    }
  };

  const onSubmitPassword = async (data: PasswordFormValues) => {
    setPasswordMessage('');
    setPasswordError('');

    try {
      await authAPI.changePassword(data);
      setPasswordMessage(
        'Password updated successfully. Please use the new password next time.',
      );
      resetPasswordForm();
    } catch (error: any) {
      const payload = error?.response?.data;
      const firstError =
        payload?.current_password?.[0] ||
        payload?.new_password?.[0] ||
        payload?.confirm_password?.[0] ||
        payload?.detail;
      setPasswordError(firstError || 'Unable to update password.');
    }
  };

  const handleResumeUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !student?.id) return;

    setIsUploading(true);
    // Simulate upload delay
    setTimeout(() => {
      const sizeStr = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
      saveResumeForStudent(student.id, file.name, sizeStr);
      setUploadedResume(getResumeForStudent(student.id));
      setIsUploading(false);
      alert('Resume file uploaded successfully!');
    }, 1200);
  };

  const handleResumeDelete = () => {
    if (
      !student?.id ||
      !window.confirm('Are you sure you want to delete your uploaded resume?')
    )
      return;
    deleteResumeForStudent(student.id);
    setUploadedResume(null);
  };

  if (!user) {
    return null;
  }

  return (
    <div style={{ display: 'grid', gap: 'var(--space-lg)' }}>
      <section className="page-header">
        <div>
          <h1>My Account Profile</h1>
          <p className="text-secondary">
            View your student credentials, grades, and manage password security.
          </p>
        </div>
      </section>

      {/* STUDENT PORTFOLIO SECTION */}
      {user.role === 'STUDENT' && (
        <section style={{ display: 'grid', gap: 'var(--space-md)' }}>
          {studentProfileQuery.isLoading && (
            <article className="card">
              <p>Loading your student records...</p>
            </article>
          )}

          {studentProfileQuery.isError && (
            <article className="card form-error">
              <h2>Student Record Not Linked</h2>
              <p className="text-secondary">
                Your login session is active, but your username has not been associated
                with a student record yet.
              </p>
            </article>
          )}

          {student && (
            <article className="card student-profile-card">
              <div
                className="student-profile-hero"
                style={{
                  borderBottom: '1px solid var(--color-border)',
                  paddingBottom: '12px',
                  marginBottom: '8px',
                }}
              >
                <div>
                  <p className="service-eyebrow">Student record</p>
                  <h2 style={{ fontSize: '26px', margin: 0 }}>{student.full_name}</h2>
                  <p className="text-secondary" style={{ margin: '4px 0 0' }}>
                    {student.college_roll_no} | {student.branch} | {student.batch}
                  </p>
                </div>
                <div
                  className="sidebar-role-badge"
                  style={{ padding: '4px 10px', fontSize: '11px' }}
                >
                  {student.status}
                </div>
              </div>

              {/* Tab selector */}
              <div className="workspace-tabs" role="tablist" style={{ margin: '8px 0' }}>
                {[
                  ['overview', 'Personal Overview'],
                  ['academics', 'Academic Grades'],
                  ['documents', 'Resume Manager'],
                  ['compliance', 'Compliance Fields'],
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
                <div className="profile-detail-grid" style={{ marginTop: '12px' }}>
                  <span>
                    <strong>Email Address</strong>
                    {student.email}
                  </span>
                  <span>
                    <strong>College Roll No</strong>
                    {student.college_roll_no}
                  </span>
                  <span>
                    <strong>Branch / Major</strong>
                    {student.branch} ({displayValue(student.major_minor_subject)})
                  </span>
                  <span>
                    <strong>Division & Batch</strong>
                    {student.division} / {student.batch}
                  </span>
                  <span>
                    <strong>WhatsApp Mobile</strong>
                    {displayValue(student.student_whatsapp_number)}
                  </span>
                  <span>
                    <strong>Expected Graduation</strong>
                    {student.expected_graduation_year} (
                    {student.entry_mode === 'LATERAL_DIPLOMA' ? 'Lateral' : 'Regular'}{' '}
                    entry)
                  </span>
                </div>
              )}

              {/* ACADEMICS PANEL */}
              {activeTab === 'academics' && (
                <div className="profile-detail-grid" style={{ marginTop: '12px' }}>
                  <span>
                    <strong>10th Board & Percentage</strong>
                    {student.academic_history?.tenth_percentage}% (
                    {student.academic_history?.tenth_board})
                  </span>
                  <span>
                    <strong>12th / Diploma percentage</strong>
                    {student.academic_history?.twelfth_or_diploma_percentage}% (
                    {student.academic_history?.twelfth_or_diploma_type})
                  </span>
                  <span>
                    <strong>Current Cumulative GPA (CGPI)</strong>
                    <strong
                      style={{
                        color: 'var(--color-primary)',
                        display: 'block',
                        fontSize: '16px',
                        marginTop: '2px',
                      }}
                    >
                      {displayValue(student.academic_history?.se_cgpi)} CGPI
                    </strong>
                  </span>
                  <span>
                    <strong>Backlogs & KTs</strong>
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
                      borderRadius: '10px',
                      padding: '14px',
                      background: '#F8FAFC',
                    }}
                  >
                    <strong>Acquired Certifications & Courses</strong>
                    <p
                      style={{
                        margin: '6px 0 0',
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
                      borderRadius: '10px',
                      padding: '14px',
                      background: '#F8FAFC',
                    }}
                  >
                    <strong>Completed Internships</strong>
                    <p
                      style={{
                        margin: '6px 0 0',
                        color: 'var(--color-slate-600)',
                        fontSize: '13px',
                      }}
                    >
                      {displayValue(student.academic_history?.internships_text)}
                    </p>
                  </div>
                </div>
              )}

              {/* DOCUMENTS & RESUME MANAGER PANEL */}
              {activeTab === 'documents' && (
                <div className="tab-panel" style={{ marginTop: '12px' }}>
                  <h2>Resume File Management</h2>
                  <p className="text-secondary" style={{ margin: 0 }}>
                    Please upload your latest professional resume. This document is
                    automatically collected and bundled when you apply to active job
                    drives or TPO exports.
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
                        <strong>No resume uploaded yet</strong>
                        <p className="text-secondary" style={{ fontSize: '13px' }}>
                          Upload a PDF or Word document to unlock job applications.
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
                          Select & Upload Resume
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
                </div>
              )}

              {/* COMPLIANCE PANEL */}
              {activeTab === 'compliance' && (
                <div className="profile-detail-grid" style={{ marginTop: '12px' }}>
                  <span>
                    <strong>Aadhaar Verification Number</strong>
                    <code>{displayValue(student.compliance?.aadhaar_number)}</code>
                  </span>
                  <span>
                    <strong>PAN Identity Number</strong>
                    <code>{displayValue(student.compliance?.pan_number)}</code>
                  </span>
                  <span>
                    <strong>Parent Contact</strong>
                    {displayValue(student.parent_whatsapp_number)}
                  </span>
                  <span>
                    <strong>Permanent Residential Address</strong>
                    {displayValue(student.residential_address)},{' '}
                    {student.residential_city}
                  </span>
                </div>
              )}
            </article>
          )}
        </section>
      )}

      {/* DYNAMIC ACCOUNT DETAILS BASED ON ROLE */}
      <div className="profile-grid">
        {user.role !== 'STUDENT' && (
          <article className="card">
            <h2>Basic Account Details</h2>
            <p className="text-secondary">
              Update your display names and email username.
            </p>
            <form
              className="profile-form"
              onSubmit={handleSubmitProfile(onSubmitProfile)}
            >
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  type="text"
                  {...registerProfile('username', { required: true, minLength: 3 })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="first_name">First Name</label>
                <input id="first_name" type="text" {...registerProfile('first_name')} />
              </div>
              <div className="form-group">
                <label htmlFor="last_name">Last Name</label>
                <input id="last_name" type="text" {...registerProfile('last_name')} />
              </div>

              {profileError && <p className="form-error">{profileError}</p>}
              {profileMessage && <p className="form-success">{profileMessage}</p>}

              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmittingProfile}
              >
                {isSubmittingProfile ? 'Updating...' : 'Update Account'}
              </button>
            </form>
          </article>
        )}

        <article className="card">
          <h2>Change Password</h2>
          <p className="text-secondary">
            Keep your account secure with a strong password.
          </p>
          <form
            className="profile-form"
            onSubmit={handleSubmitPassword(onSubmitPassword)}
          >
            <div className="form-group">
              <label htmlFor="current_password">Current Password</label>
              <input
                id="current_password"
                type="password"
                {...registerPassword('current_password', { required: true })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="new_password">New Password</label>
              <input
                id="new_password"
                type="password"
                {...registerPassword('new_password', { required: true, minLength: 8 })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirm_password">Confirm New Password</label>
              <input
                id="confirm_password"
                type="password"
                {...registerPassword('confirm_password', {
                  required: true,
                  minLength: 8,
                })}
              />
            </div>

            {passwordError && <p className="form-error">{passwordError}</p>}
            {passwordMessage && <p className="form-success">{passwordMessage}</p>}

            <button type="submit" className="btn-success" disabled={isSubmittingPassword}>
              {isSubmittingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </article>
      </div>
    </div>
  );
};

export default ProfilePage;

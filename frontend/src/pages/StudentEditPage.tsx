import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '../lib/legacyQuery';

import StudentsServiceNav from '../components/students/StudentsServiceNav';
import { useAuth } from '../context/AuthContext';
import { StudentProfile, studentsAPI } from '../services/api';

const emptyAcademicHistory = {
  tenth_percentage: null,
  tenth_year_of_passing: null,
  tenth_board: '',
  twelfth_or_diploma_type: '' as const,
  twelfth_or_diploma_percentage: null,
  twelfth_or_diploma_year_of_passing: null,
  twelfth_board: '',
  btech_sem1_sgpi: null,
  btech_sem2_sgpi: null,
  btech_sem3_sgpi: null,
  btech_sem4_sgpi: null,
  se_cgpi: null,
  se_percentage: null,
  live_kt: 0,
  dead_kt: 0,
  drop_count: 0,
  gap_count: 0,
  courses_done_text: '',
  internships_text: '',
};

const emptyCompliance = {
  aadhaar_number: '',
  pan_number: '',
};

const parseOptionalInt = (value: string) => (value === '' ? null : Number(value));
const parseRequiredInt = (value: string) => (value === '' ? 0 : Number(value));
const parseDecimal = (value: string) => (value.trim() === '' ? null : value);

const StudentEditPage: React.FC = () => {
  const { user } = useAuth();
  const params = useParams();
  const navigate = useNavigate();
  const studentId = Number(params.studentId);
  const [draft, setDraft] = React.useState<StudentProfile | null>(null);
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);
  const canManageStudents =
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'TPO' ||
    user?.role === 'HOD' ||
    user?.role === 'VOLUNTEER';

  const studentQuery = useQuery(
    ['student-detail', studentId],
    async () => {
      const response = await studentsAPI.detail(studentId);
      return response.data;
    },
    { enabled: canManageStudents && Number.isFinite(studentId) },
  );

  React.useEffect(() => {
    if (!studentQuery.data) {
      return;
    }

    setDraft({
      ...studentQuery.data,
      academic_history: studentQuery.data.academic_history || emptyAcademicHistory,
      compliance: studentQuery.data.compliance || emptyCompliance,
    });
  }, [studentQuery.data]);

  const updateDraft = <K extends keyof StudentProfile>(
    field: K,
    value: StudentProfile[K],
  ) => {
    setDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const updateAcademic = (field: string, value: string | number | null) => {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            academic_history: {
              ...(prev.academic_history || emptyAcademicHistory),
              [field]: value,
            },
          }
        : prev,
    );
  };

  const updateCompliance = (field: string, value: string) => {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            compliance: {
              ...(prev.compliance || emptyCompliance),
              [field]: value,
            },
          }
        : prev,
    );
  };

  const handleSave = async () => {
    if (!draft) {
      return;
    }

    setMessage('');
    setError('');
    setIsSaving(true);

    try {
      const response = await studentsAPI.update(draft.id, draft);
      setDraft({
        ...response.data,
        academic_history: response.data.academic_history || emptyAcademicHistory,
        compliance: response.data.compliance || emptyCompliance,
      });
      setMessage('Student profile updated successfully.');
    } catch (apiError: any) {
      const payload = apiError?.response?.data;
      const firstError =
        payload?.detail ||
        payload?.email?.[0] ||
        payload?.college_roll_no?.[0] ||
        payload?.program_duration_years?.[0] ||
        'Unable to update student profile.';
      setError(firstError);
    } finally {
      setIsSaving(false);
    }
  };

  if (!canManageStudents) {
    return (
      <article className="card">
        <h2>Student Management Unavailable</h2>
        <p className="text-secondary">
          Student profile management is available for authorized roles.
        </p>
      </article>
    );
  }

  return (
    <main className="service-layout">
      <StudentsServiceNav studentId={studentId} />

      <section className="service-content">
        {studentQuery.isLoading && (
          <article className="card">Loading student record...</article>
        )}
        {studentQuery.isError && (
          <article className="card form-error">
            Could not load this student record.
          </article>
        )}

        {draft && (
          <article className="card student-editor">
            <div className="student-editor-header">
              <div>
                <p className="service-eyebrow">Edit student</p>
                <h1>{draft.full_name}</h1>
                <p className="text-secondary">
                  Changes update the CRM student profile. Account login details remain
                  managed from Accounts.
                </p>
              </div>
              <div className="header-actions">
                <Link className="btn-secondary button-link" to={`/students/${draft.id}`}>
                  View Profile
                </Link>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </div>

            {message && (
              <p className="form-success">
                {message}{' '}
                <button
                  type="button"
                  className="link-button"
                  onClick={() => navigate(`/students/${draft.id}`)}
                >
                  Open profile
                </button>
              </p>
            )}
            {error && <p className="form-error">{error}</p>}

            <h2>Identity</h2>
            <div className="student-form-grid">
              <label className="form-group">
                Full Name
                <input
                  value={draft.full_name}
                  onChange={(event) => updateDraft('full_name', event.target.value)}
                />
              </label>
              <label className="form-group">
                Email
                <input
                  type="email"
                  value={draft.email}
                  onChange={(event) => updateDraft('email', event.target.value)}
                />
              </label>
              <label className="form-group">
                Roll Number
                <input
                  value={draft.college_roll_no}
                  onChange={(event) => updateDraft('college_roll_no', event.target.value)}
                />
              </label>
              <label className="form-group">
                Admission Year
                <input
                  type="number"
                  value={draft.admission_year}
                  onChange={(event) =>
                    updateDraft('admission_year', parseRequiredInt(event.target.value))
                  }
                />
              </label>
              <label className="form-group">
                Entry Mode
                <select
                  value={draft.entry_mode}
                  onChange={(event) => {
                    const entryMode = event.target.value as StudentProfile['entry_mode'];
                    updateDraft('entry_mode', entryMode);
                    updateDraft(
                      'program_duration_years',
                      entryMode === 'LATERAL_DIPLOMA' ? 3 : 4,
                    );
                  }}
                >
                  <option value="REGULAR">Regular</option>
                  <option value="LATERAL_DIPLOMA">Lateral Diploma</option>
                </select>
              </label>
              <label className="form-group">
                Status
                <select
                  value={draft.status}
                  onChange={(event) =>
                    updateDraft('status', event.target.value as StudentProfile['status'])
                  }
                >
                  <option value="ACTIVE">Active</option>
                  <option value="ALUMNI">Alumni</option>
                  <option value="EXTENDED">Extended</option>
                  <option value="GRADUATED">Graduated</option>
                </select>
              </label>
              <label className="form-group">
                Branch
                <input
                  value={draft.branch}
                  onChange={(event) => updateDraft('branch', event.target.value)}
                />
              </label>
              <label className="form-group">
                Division
                <input
                  value={draft.division}
                  onChange={(event) => updateDraft('division', event.target.value)}
                />
              </label>
              <label className="form-group">
                Batch
                <input
                  value={draft.batch}
                  onChange={(event) => updateDraft('batch', event.target.value)}
                />
              </label>
              <label className="form-group">
                Major / Minor
                <input
                  value={draft.major_minor_subject}
                  onChange={(event) =>
                    updateDraft('major_minor_subject', event.target.value)
                  }
                />
              </label>
            </div>

            <h2>Contact & Address</h2>
            <div className="student-form-grid">
              <label className="form-group">
                Student WhatsApp
                <input
                  value={draft.student_whatsapp_number}
                  onChange={(event) =>
                    updateDraft('student_whatsapp_number', event.target.value)
                  }
                />
              </label>
              <label className="form-group">
                Parent WhatsApp
                <input
                  value={draft.parent_whatsapp_number}
                  onChange={(event) =>
                    updateDraft('parent_whatsapp_number', event.target.value)
                  }
                />
              </label>
              <label className="form-group">
                Parent Email
                <input
                  type="email"
                  value={draft.parent_email}
                  onChange={(event) => updateDraft('parent_email', event.target.value)}
                />
              </label>
              <label className="form-group">
                Date of Birth
                <input
                  type="date"
                  value={draft.date_of_birth || ''}
                  onChange={(event) =>
                    updateDraft('date_of_birth', event.target.value || null)
                  }
                />
              </label>
              <label className="form-group">
                Gender
                <select
                  value={draft.gender}
                  onChange={(event) =>
                    updateDraft('gender', event.target.value as StudentProfile['gender'])
                  }
                >
                  <option value="">Not specified</option>
                  <option value="FEMALE">Female</option>
                  <option value="MALE">Male</option>
                  <option value="OTHER">Other</option>
                  <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                </select>
              </label>
              <label className="form-group">
                Nationality
                <input
                  value={draft.nationality}
                  onChange={(event) => updateDraft('nationality', event.target.value)}
                />
              </label>
              <label className="form-group">
                City
                <input
                  value={draft.residential_city}
                  onChange={(event) =>
                    updateDraft('residential_city', event.target.value)
                  }
                />
              </label>
              <label className="form-group">
                Pin Code
                <input
                  value={draft.pin_code}
                  onChange={(event) => updateDraft('pin_code', event.target.value)}
                />
              </label>
              <label className="form-group">
                Native Place
                <input
                  value={draft.native_place}
                  onChange={(event) => updateDraft('native_place', event.target.value)}
                />
              </label>
              <label className="form-group">
                Current Location
                <input
                  value={draft.current_location}
                  onChange={(event) =>
                    updateDraft('current_location', event.target.value)
                  }
                />
              </label>
              <label className="form-group form-group-wide">
                Residential Address
                <textarea
                  value={draft.residential_address}
                  onChange={(event) =>
                    updateDraft('residential_address', event.target.value)
                  }
                />
              </label>
            </div>

            <h2>Academic History</h2>
            <div className="student-form-grid">
              <label className="form-group">
                10th %
                <input
                  value={draft.academic_history?.tenth_percentage ?? ''}
                  onChange={(event) =>
                    updateAcademic('tenth_percentage', parseDecimal(event.target.value))
                  }
                />
              </label>
              <label className="form-group">
                10th Passing Year
                <input
                  type="number"
                  value={draft.academic_history?.tenth_year_of_passing ?? ''}
                  onChange={(event) =>
                    updateAcademic(
                      'tenth_year_of_passing',
                      parseOptionalInt(event.target.value),
                    )
                  }
                />
              </label>
              <label className="form-group">
                10th Board
                <input
                  value={draft.academic_history?.tenth_board ?? ''}
                  onChange={(event) => updateAcademic('tenth_board', event.target.value)}
                />
              </label>
              <label className="form-group">
                12th / Diploma
                <select
                  value={draft.academic_history?.twelfth_or_diploma_type ?? ''}
                  onChange={(event) =>
                    updateAcademic('twelfth_or_diploma_type', event.target.value)
                  }
                >
                  <option value="">Not specified</option>
                  <option value="12TH">12th</option>
                  <option value="DIPLOMA">Diploma</option>
                </select>
              </label>
              <label className="form-group">
                12th / Diploma %
                <input
                  value={draft.academic_history?.twelfth_or_diploma_percentage ?? ''}
                  onChange={(event) =>
                    updateAcademic(
                      'twelfth_or_diploma_percentage',
                      parseDecimal(event.target.value),
                    )
                  }
                />
              </label>
              <label className="form-group">
                12th / Diploma Year
                <input
                  type="number"
                  value={draft.academic_history?.twelfth_or_diploma_year_of_passing ?? ''}
                  onChange={(event) =>
                    updateAcademic(
                      'twelfth_or_diploma_year_of_passing',
                      parseOptionalInt(event.target.value),
                    )
                  }
                />
              </label>
              <label className="form-group">
                Sem 1 SGPI
                <input
                  value={draft.academic_history?.btech_sem1_sgpi ?? ''}
                  onChange={(event) =>
                    updateAcademic('btech_sem1_sgpi', parseDecimal(event.target.value))
                  }
                />
              </label>
              <label className="form-group">
                Sem 2 SGPI
                <input
                  value={draft.academic_history?.btech_sem2_sgpi ?? ''}
                  onChange={(event) =>
                    updateAcademic('btech_sem2_sgpi', parseDecimal(event.target.value))
                  }
                />
              </label>
              <label className="form-group">
                Sem 3 SGPI
                <input
                  value={draft.academic_history?.btech_sem3_sgpi ?? ''}
                  onChange={(event) =>
                    updateAcademic('btech_sem3_sgpi', parseDecimal(event.target.value))
                  }
                />
              </label>
              <label className="form-group">
                Sem 4 SGPI
                <input
                  value={draft.academic_history?.btech_sem4_sgpi ?? ''}
                  onChange={(event) =>
                    updateAcademic('btech_sem4_sgpi', parseDecimal(event.target.value))
                  }
                />
              </label>
              <label className="form-group">
                SE CGPI
                <input
                  value={draft.academic_history?.se_cgpi ?? ''}
                  onChange={(event) =>
                    updateAcademic('se_cgpi', parseDecimal(event.target.value))
                  }
                />
              </label>
              <label className="form-group">
                SE %
                <input
                  value={draft.academic_history?.se_percentage ?? ''}
                  onChange={(event) =>
                    updateAcademic('se_percentage', parseDecimal(event.target.value))
                  }
                />
              </label>
              <label className="form-group">
                Live KT
                <input
                  type="number"
                  value={draft.academic_history?.live_kt ?? 0}
                  onChange={(event) =>
                    updateAcademic('live_kt', parseRequiredInt(event.target.value))
                  }
                />
              </label>
              <label className="form-group">
                Dead KT
                <input
                  type="number"
                  value={draft.academic_history?.dead_kt ?? 0}
                  onChange={(event) =>
                    updateAcademic('dead_kt', parseRequiredInt(event.target.value))
                  }
                />
              </label>
              <label className="form-group">
                Drop Count
                <input
                  type="number"
                  value={draft.academic_history?.drop_count ?? 0}
                  onChange={(event) =>
                    updateAcademic('drop_count', parseRequiredInt(event.target.value))
                  }
                />
              </label>
              <label className="form-group">
                Gap Count
                <input
                  type="number"
                  value={draft.academic_history?.gap_count ?? 0}
                  onChange={(event) =>
                    updateAcademic('gap_count', parseRequiredInt(event.target.value))
                  }
                />
              </label>
              <label className="form-group form-group-wide">
                Courses Done
                <textarea
                  value={draft.academic_history?.courses_done_text ?? ''}
                  onChange={(event) =>
                    updateAcademic('courses_done_text', event.target.value)
                  }
                />
              </label>
              <label className="form-group form-group-wide">
                Internships
                <textarea
                  value={draft.academic_history?.internships_text ?? ''}
                  onChange={(event) =>
                    updateAcademic('internships_text', event.target.value)
                  }
                />
              </label>
            </div>

            <h2>Compliance</h2>
            <div className="student-form-grid">
              <label className="form-group">
                Aadhaar Number
                <input
                  value={draft.compliance?.aadhaar_number ?? ''}
                  onChange={(event) =>
                    updateCompliance('aadhaar_number', event.target.value)
                  }
                />
              </label>
              <label className="form-group">
                PAN Number
                <input
                  value={draft.compliance?.pan_number ?? ''}
                  onChange={(event) =>
                    updateCompliance('pan_number', event.target.value.toUpperCase())
                  }
                />
              </label>
            </div>
          </article>
        )}
      </section>
    </main>
  );
};

export default StudentEditPage;

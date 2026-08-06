import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { studentsAPI, trainingAPI, StudentProfile } from '../services/api';

interface Lecture {
  id: number;
  program_id: number;
  title: string;
  date: string;
  session_type: string;
  batch?: string;
}

interface AttendanceRecord {
  id: number;
  lecture_id: number;
  student_id: number;
  status: 'BOTH' | 'MS' | 'AS' | 'ABSENT';
  student_name?: string;
  student_roll?: string;
}

const TrainingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Selection States
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  
  // Active Batch Tab Filter (Default pre-selected batch is Batch 1)
  const [activeBatchTab, setActiveBatchTab] = useState<string>('Batch 1');



  const canManageTraining = user?.role === 'SUPER_ADMIN' || user?.role === 'TPO' || user?.role === 'HOD' || user?.role === 'VOLUNTEER';
  const isStudent = user?.role === 'STUDENT';

  // --- React Query Endpoints ---

  // 1. Fetch Student Profile for logged in student
  const studentMeQuery = useQuery(
    ['student-profile-me-training-tab'],
    async () => {
      const response = await studentsAPI.me();
      return response.data;
    },
    { enabled: isStudent, retry: false }
  );

  const student = studentMeQuery.data;

  // 2. Fetch all lectures
  const lecturesQuery = useQuery(
    ['training-lectures-list-all'],
    async () => {
      const response = await trainingAPI.lectures();
      return response.data?.results || [];
    },
    {
      onSuccess: (data) => {
        // Auto select first lecture matching default batch
        const matching = data.find((l: any) => l.batch === activeBatchTab);
        if (matching && !selectedLecture) {
          setSelectedLecture(matching);
        }
      }
    }
  );

  const lectures: Lecture[] = lecturesQuery.data || [];

  // 3. Fetch student profiles (roster checklist)
  const studentsQuery = useQuery(
    ['students-directory-list-training'],
    async () => {
      const response = await studentsAPI.list(1, '');
      return response.data?.results || [];
    },
    { enabled: !isStudent }
  );

  const studentsList: StudentProfile[] = studentsQuery.data || [];

  // 4. Fetch all batches
  const batchesQuery = useQuery(
    ['training-batches-list'],
    async () => {
      const response = await trainingAPI.batches();
      return response.data?.results || [];
    }
  );

  const batches = batchesQuery.data || [];

  // 5. Fetch attendance records for selected lecture
  const attendanceQuery = useQuery(
    ['training-attendance-lecture', selectedLecture?.id],
    async () => {
      if (!selectedLecture?.id) return [];
      const response = await trainingAPI.attendance(selectedLecture.id);
      return response.data?.results || [];
    },
    { enabled: !isStudent && !!selectedLecture?.id }
  );

  const lectureAttendance: AttendanceRecord[] = attendanceQuery.data || [];

  // 6. Fetch attendance records for logged in student
  const studentAttendanceQuery = useQuery(
    ['student-attendance-records', student?.id],
    async () => {
      if (!student?.id) return [];
      const response = await trainingAPI.attendance(undefined, student.id);
      return response.data?.results || [];
    },
    { enabled: isStudent && !!student?.id }
  );

  const myAttendance: AttendanceRecord[] = studentAttendanceQuery.data || [];

  // --- Handlers ---



  const handleMarkAttendance = async (studentId: number, status: string) => {
    if (!selectedLecture) return;

    try {
      await trainingAPI.markAttendance({
        lecture_id: selectedLecture.id,
        student_id: studentId,
        status: status
      });
      attendanceQuery.refetch();
    } catch {
      alert('Unable to save attendance turnout.');
    }
  };

  // --- Student turnouts stats ---
  const calculateStudentStats = () => {
    // Filter lectures scheduled for the student's batch
    const studentLectures = lectures.filter(l => l.batch === student?.batch);
    if (studentLectures.length === 0) return { percentage: 100, attended: 0, total: 0 };

    const totalSlots = studentLectures.length * 2;
    let attendedSlots = 0;

    studentLectures.forEach(l => {
      const record = myAttendance.find(a => a.lecture_id === l.id);
      if (record) {
        if (record.status === 'BOTH') {
          attendedSlots += 2;
        } else if (record.status === 'MS' || record.status === 'AS') {
          attendedSlots += 1;
        }
      }
    });

    const percentage = totalSlots > 0 ? Math.round((attendedSlots / totalSlots) * 100) : 100;
    return { percentage, attended: attendedSlots, total: totalSlots };
  };

  const studentStats = calculateStudentStats();

  // Filter cohort active 3rd-year students matching the selected batch
  const eligibleRoster = studentsList.filter((s) => {
    const is3rdYear = Number(s.current_academic_year) === 3 || s.current_academic_year === '3';
    const isActive = s.status === 'ACTIVE' && s.is_active;
    const matchesBatch = s.batch === activeBatchTab;
    return is3rdYear && isActive && matchesBatch;
  });

  // Filter lectures for the active batch tab
  const batchLectures = lectures.filter(l => l.batch === activeBatchTab);

  // Separate batchLectures into Current & Past
  const todayStr = new Date().toISOString().split('T')[0];
  const currentSessions = batchLectures.filter(l => l.date >= todayStr);
  const pastSessions = batchLectures.filter(l => l.date < todayStr);

  // --- Views ---

  // 1. STUDENT VIEW - Turnouts Ledger
  const renderStudentView = () => {
    const is4thYear = Number(student?.current_academic_year) === 4 || student?.current_academic_year === '4';
    if (is4thYear) {
      return (
        <article className="card empty-module-state">
          <strong>Training Attendance Not Applicable</strong>
          <p className="text-secondary" style={{ marginTop: '6px' }}>
            As a final-year 4th-year student, you are placement-focused only and excluded from training attendance rosters.
          </p>
        </article>
      );
    }

    const studentLectures = lectures.filter(l => l.batch === student?.batch);

    return (
      <div style={{ display: 'grid', gap: 'var(--space-lg)' }}>
        <section className="page-header">
          <div>
            <h1>Training Attendance & Schedule</h1>
            <p className="text-secondary">Track your morning and afternoon training turnouts under your division cohort.</p>
          </div>
        </section>

        <div className="service-layout" style={{ gridTemplateColumns: '1fr' }}>
          <section className="service-content">
            <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
              
              {/* Summary Stats */}
              <article className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h2>My Division: {student?.batch || 'Unassigned'}</h2>
                  <span className="table-subtext" style={{ display: 'block', marginTop: '4px' }}>
                    Active training turnouts tracking active
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="kpi-label" style={{ display: 'block', fontSize: '11px' }}>Attendance Rate</span>
                  <strong 
                    className="kpi-value" 
                    style={{ 
                      fontSize: '32px', 
                      color: studentStats.percentage >= 85 ? 'var(--color-accent)' : 'var(--color-primary)' 
                    }}
                  >
                    {studentStats.percentage}%
                  </strong>
                  <span className="table-subtext" style={{ display: 'block' }}>
                    Attended {studentStats.attended} of {studentStats.total} slots
                  </span>
                </div>
              </article>

              {/* Attendance outcome grid */}
              <article className="card">
                <h3>Session Outcomes Ledger</h3>
                <p className="text-secondary" style={{ marginBottom: '14px' }}>Detailed breakdown of morning and afternoon session turnouts.</p>

                <div className="student-directory-table-wrapper">
                  <table className="student-directory-table">
                    <thead>
                      <tr>
                        <th>Training Session Title</th>
                        <th>Schedule Date</th>
                        <th>Session Slots Type</th>
                        <th>Your Attendance Outcome</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentLectures.map((l) => {
                        const record = myAttendance.find(a => a.lecture_id === l.id);
                        const status = record?.status || 'ABSENT';

                        const getStatusLabel = (s: string) => {
                          switch (s) {
                            case 'BOTH':
                              return 'Present (Morning & Afternoon)';
                            case 'MS':
                              return 'Morning Session Present (Afternoon Absent)';
                            case 'AS':
                              return 'Afternoon Session Present (Morning Absent)';
                            default:
                              return 'Absent / No Record';
                          }
                        };

                        const getStatusClass = (s: string) => {
                          if (s === 'BOTH') return 'badge-active';
                          if (s === 'ABSENT') return 'badge-not-eligible';
                          return 'badge-extended';
                        };

                        return (
                          <tr key={l.id}>
                            <td><strong>{l.title}</strong></td>
                            <td>{l.date}</td>
                            <td>{l.session_type}</td>
                            <td>
                              <span className={`badge ${getStatusClass(status)}`}>
                                {getStatusLabel(status)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {studentLectures.length === 0 && (
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'center', padding: '18px' }}>
                            No scheduled training sessions found for your division batch.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </article>
            </div>
          </section>
        </div>
      </div>
    );
  };

  // 2. ADMIN/VOLUNTEER VIEW - Sessions board & rosters
  const renderAdminView = () => {
    const isToday = (dateString: string) => {
      if (!dateString) return false;
      const todayObj = new Date();
      const yyyy = todayObj.getFullYear();
      const mm = String(todayObj.getMonth() + 1).padStart(2, '0');
      const dd = String(todayObj.getDate()).padStart(2, '0');
      const todayStr = `${yyyy}-${mm}-${dd}`;
      
      const normalizedDate = dateString.trim().toLowerCase();
      if (normalizedDate.includes('today')) return true;
      if (normalizedDate === todayStr) return true;
      try {
        const d1 = new Date(dateString).toDateString();
        const d2 = todayObj.toDateString();
        return d1 === d2;
      } catch (e) {
        return false;
      }
    };

    return (
      <div style={{ display: 'grid', gap: 'var(--space-lg)' }}>
        
        {/* Header Bar */}
        <section className="page-header" style={{ margin: 0, padding: 0 }}>
          <div>
            <h1>Training Sessions Board</h1>
            <p className="text-secondary" style={{ margin: 0 }}>Select a batch to schedule sessions and log student daily turnout attendance.</p>
          </div>
          {canManageTraining && (
            <button 
              type="button" 
              className="btn-primary" 
              onClick={() => navigate('/training/create')}
            >
              Create Training Session
            </button>
          )}
        </section>

        {/* Dynamic Batch Selector Tabs */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px', flexWrap: 'wrap' }}>
          {batches.map((b: any) => (
            <button
              key={b.name}
              type="button"
              style={{
                padding: '10px 18px',
                fontSize: '13.5px',
                fontWeight: 'bold',
                cursor: 'pointer',
                borderRadius: '6px',
                border: 'none',
                background: activeBatchTab === b.name ? 'var(--color-primary)' : 'none',
                color: activeBatchTab === b.name ? '#ffffff' : 'var(--color-slate-600)',
                boxShadow: activeBatchTab === b.name ? '0 2px 6px rgba(139,30,30,0.2)' : 'none',
                transition: 'all 0.2s'
              }}
              onClick={() => {
                setActiveBatchTab(b.name);
                // Also default the selected lecture to the first of this batch
                const firstBatchLecture = lectures.find(l => l.batch === b.name);
                if (firstBatchLecture) {
                  setSelectedLecture(firstBatchLecture);
                } else {
                  setSelectedLecture(null);
                }
              }}
            >
              {b.name}
            </button>
          ))}
        </div>

        {/* Program Sidebar & Main Workspace */}
        <div className="service-layout">
          
          {/* Session Board Lists */}
          <aside className="service-nav" style={{ minWidth: '240px' }}>
            <div style={{ display: 'grid', gap: '14px' }}>
              
              {/* CURRENT & UPCOMING SESSIONS */}
              <div>
                <strong style={{ fontSize: '12px', color: 'var(--color-slate-400)', display: 'block', marginBottom: '6px' }}>
                  TODAY & SCHEDULED
                </strong>
                {currentSessions.map(l => {
                  const todayGlow = isToday(l.date);
                  return (
                    <button
                      key={l.id}
                      type="button"
                      className={`service-nav-link ${selectedLecture?.id === l.id ? 'is-active' : ''}`}
                      style={{ textAlign: 'left', padding: '8px 10px', borderRadius: '6px', width: '100%', marginBottom: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}
                      onClick={() => setSelectedLecture(l)}
                    >
                      <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span>{l.title}</span>
                        {todayGlow && (
                          <span className="badge badge-today-pulse" style={{ fontSize: '9px', padding: '2px 6px' }}>TODAY</span>
                        )}
                      </strong>
                      <span className="table-subtext">{l.date} ({l.session_type})</span>
                    </button>
                  );
                })}
                {currentSessions.length === 0 && (
                  <div className="table-subtext" style={{ padding: '6px 10px', fontStyle: 'italic' }}>
                    No upcoming sessions
                  </div>
                )}
              </div>

              {/* PAST SESSIONS ARCHIVE */}
              <div>
                <strong style={{ fontSize: '12px', color: 'var(--color-slate-400)', display: 'block', marginBottom: '6px' }}>
                  PAST ARCHIVES
                </strong>
                {pastSessions.map(l => {
                  const todayGlow = isToday(l.date);
                  return (
                    <button
                      key={l.id}
                      type="button"
                      className={`service-nav-link ${selectedLecture?.id === l.id ? 'is-active' : ''} is-past-event`}
                      style={{ textAlign: 'left', padding: '8px 10px', borderRadius: '6px', width: '100%', marginBottom: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}
                      onClick={() => setSelectedLecture(l)}
                    >
                      <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span>{l.title}</span>
                        {todayGlow && (
                          <span className="badge badge-today-pulse" style={{ fontSize: '9px', padding: '2px 6px' }}>TODAY</span>
                        )}
                      </strong>
                      <span className="table-subtext">{l.date} ({l.session_type})</span>
                    </button>
                  );
                })}
                {pastSessions.length === 0 && (
                  <div className="table-subtext" style={{ padding: '6px 10px', fontStyle: 'italic' }}>
                    No past sessions
                  </div>
                )}
              </div>

            </div>
          </aside>

          {/* Attendance marking Workspace */}
          <section className="service-content" style={{ display: 'grid', gap: '20px' }}>
            
            {/* Attendance Marking Worksheet */}
            {selectedLecture ? (
              <article className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <span className="service-eyebrow">Cohort: {selectedLecture.batch || activeBatchTab}</span>
                    <h2 style={{ fontSize: '18px', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {selectedLecture.title}
                      {isToday(selectedLecture.date) && (
                        <span className="badge badge-today-pulse" style={{ fontSize: '10px', padding: '3px 8px' }}>TODAY</span>
                      )}
                    </h2>
                    <p className="text-secondary" style={{ marginBottom: '10px', fontSize: '13px' }}>
                      Date: {selectedLecture.date} | Session Mode: {selectedLecture.session_type}
                    </p>
                  </div>
                  
                  <button 
                    type="button" 
                    className="btn-primary" 
                    style={{ padding: '8px 14px', fontSize: '13px' }}
                    onClick={() => navigate(`/training/mark-single/${selectedLecture.id}`)}
                  >
                    Launch Fast Attendance Marker
                  </button>
                </div>

                <div className="student-directory-table-wrapper" style={{ marginTop: '12px' }}>
                  <table className="student-directory-table">
                    <thead>
                      <tr>
                        <th>Student Details</th>
                        <th>Roll Number</th>
                        <th>Session Attendance Outcomes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eligibleRoster.map((s) => {
                        const record = lectureAttendance.find(a => a.student_id === s.id);
                        const status = record?.status || 'ABSENT';

                        return (
                          <tr key={s.id}>
                            <td>
                              <strong>{s.full_name}</strong>
                              <span className="table-subtext">{s.branch} • Batch: {s.batch}</span>
                            </td>
                            <td><code>{s.college_roll_no}</code></td>
                            <td>
                              <select
                                value={status}
                                style={{ padding: '6px', fontSize: '13px', borderRadius: '6px' }}
                                onChange={(e) => handleMarkAttendance(s.id, e.target.value)}
                              >
                                <option value="ABSENT">Absent (No turnouts)</option>
                                <option value="BOTH">Both sessions present</option>
                                <option value="MS">Morning Session (MS) only</option>
                                <option value="AS">Afternoon Session (AS) only</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                      {eligibleRoster.length === 0 && (
                        <tr>
                          <td colSpan={3} style={{ textAlign: 'center', padding: '24px', color: 'var(--color-slate-400)' }}>
                            No active 3rd-year students in division "{activeBatchTab}" found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </article>
            ) : (
              <article className="card empty-module-state">
                <strong>No session lecture selected</strong>
                <p className="text-secondary">Please schedule a session or pick a division slot from the sidebar to take attendance turnout records.</p>
              </article>
            )}
          </section>

        </div>
      </div>
    );
  };

  return isStudent ? renderStudentView() : renderAdminView();
};

export default TrainingPage;

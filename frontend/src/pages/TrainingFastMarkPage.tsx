import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '../lib/legacyQuery';

import { trainingAPI, studentsAPI } from '../services/api';

const TrainingFastMarkPage: React.FC = () => {
  const { lectureId } = useParams<{ lectureId: string }>();
  const navigate = useNavigate();

  const [rollNumber, setRollNumber] = useState('');
  const [sessionTurnout, setSessionTurnout] = useState<'BOTH' | 'MS' | 'AS' | 'ABSENT'>(
    'BOTH',
  );
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Fetch all training lectures to resolve the current one
  const lecturesQuery = useQuery(['training-lectures-fast-mark'], async () => {
    const response = await trainingAPI.lectures();
    return response.data?.results || [];
  });

  const currentLecture = lecturesQuery.data?.find((l: any) => l.id === Number(lectureId));

  // Target batch
  const targetBatch = currentLecture?.batch || '';

  // 3. Fetch student list
  const studentsQuery = useQuery(['students-list-fast-mark'], async () => {
    const response = await studentsAPI.list(1, '');
    return response.data?.results || [];
  });

  // Filter cohort down to: ACTIVE, 3rd Year (current_academic_year = 3), matching the batch!
  const eligibleCohort = (studentsQuery.data || []).filter((s: any) => {
    const is3rdYear =
      Number(s.current_academic_year) === 3 || s.current_academic_year === '3';
    const isActive = s.status === 'ACTIVE' && s.is_active;
    const matchesBatch = targetBatch ? s.batch === targetBatch : true;
    return is3rdYear && isActive && matchesBatch;
  });

  const handleMarkAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmationMessage('');
    setErrorMessage('');

    if (!rollNumber) {
      alert('Please select or enter a student roll number.');
      return;
    }

    const resolvedStudent = eligibleCohort.find(
      (s) => s.college_roll_no.trim().toLowerCase() === rollNumber.trim().toLowerCase(),
    );

    if (!resolvedStudent) {
      alert(
        `Student with Roll Number "${rollNumber}" is either not in the 3rd year cohort of ${targetBatch || 'this batch'} or doesn't exist.`,
      );
      return;
    }

    setSubmitting(true);

    try {
      const response = await trainingAPI.markAttendanceByRoll({
        lecture_id: Number(lectureId),
        college_roll_no: resolvedStudent.college_roll_no,
        status: sessionTurnout,
      });

      const data = response.data;
      let msg = '';

      if (data.action === 'ADDED') {
        msg = `added attendance for ${data.student_roll} for BOTH sessions`;
      } else {
        msg = `updated attendance for ${data.student_roll}`;
      }

      setConfirmationMessage(msg);
      setRollNumber(''); // clear out input for fast subsequent typing!
      setSearchQuery('');
    } catch (err: any) {
      const errMsg = err?.response?.data?.detail || 'Unable to log turnout attendance.';
      setErrorMessage(`Error marking ${rollNumber}: ${errMsg}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter dropdown suggestions based on search text input
  const filteredSuggestions = eligibleCohort.filter((s: any) => {
    const search = searchQuery.toLowerCase().trim();
    if (!search) return false;
    return (
      s.college_roll_no.toLowerCase().includes(search) ||
      s.full_name.toLowerCase().includes(search)
    );
  });

  return (
    <div style={{ display: 'grid', gap: 'var(--space-lg)', justifyItems: 'center' }}>
      {/* Header Bar */}
      <section className="page-header" style={{ width: '100%', maxWidth: '600px' }}>
        <div style={{ width: '100%' }}>
          <button
            type="button"
            className="btn-secondary"
            style={{ marginBottom: '12px', padding: '6px 12px', fontSize: '12.5px' }}
            onClick={() => navigate('/training')}
          >
            ← Back to Training Planner
          </button>
          <h1 style={{ textAlign: 'left' }}>Fast Attendance Marker</h1>
          <p className="text-secondary" style={{ textAlign: 'left' }}>
            Rapid-fire student turnout logger.
          </p>
        </div>
      </section>

      {/* Main Form Centered Card */}
      <article
        className="card"
        style={{ display: 'grid', gap: '20px', width: '100%', maxWidth: '600px' }}
      >
        <div>
          <span className="service-eyebrow">
            Training Session {targetBatch ? `• ${targetBatch}` : ''}
          </span>
          <h2 style={{ fontSize: '20px', marginTop: '4px' }}>
            {currentLecture?.title || 'Lecture Loading...'}
          </h2>
          <p className="text-secondary" style={{ fontSize: '13px', margin: 0 }}>
            Session Date: {currentLecture?.date} | Target: 3rd Year Students only
          </p>
        </div>

        {/* Confirmation Banner */}
        {confirmationMessage && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#dcfce7',
              color: '#166534',
              border: '1px solid #bbf7d0',
              borderRadius: '6px',
              fontSize: '13.5px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            <span style={{ fontSize: '16px' }}>✓</span> {confirmationMessage}
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              border: '1px solid #fca5a5',
              borderRadius: '6px',
              fontSize: '13.5px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            <span style={{ fontSize: '16px' }}>⚠</span> {errorMessage}
          </div>
        )}

        <form onSubmit={handleMarkAttendance} style={{ display: 'grid', gap: '20px' }}>
          {/* Autocomplete Input */}
          <div className="form-group" style={{ position: 'relative' }}>
            <label htmlFor="rollSearch">Student Roll Number</label>
            <input
              id="rollSearch"
              type="text"
              value={rollNumber || searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setRollNumber(e.target.value);
              }}
              placeholder="Type or select Roll Number, e.g. CSE2023-021"
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                borderRadius: '6px',
              }}
              autoComplete="off"
            />

            {/* Suggestions Overlay */}
            {filteredSuggestions.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid var(--color-border)',
                  borderRadius: '0 0 6px 6px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  zIndex: 10,
                  maxHeight: '180px',
                  overflowY: 'auto',
                }}
              >
                {filteredSuggestions.map((s: any) => (
                  <button
                    key={s.id}
                    type="button"
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 12px',
                      border: 'none',
                      borderBottom: '1px solid #f1f5f9',
                      background: 'none',
                      cursor: 'pointer',
                      fontSize: '13px',
                    }}
                    onClick={() => {
                      setRollNumber(s.college_roll_no);
                      setSearchQuery('');
                    }}
                  >
                    <strong>{s.college_roll_no}</strong> — {s.full_name} ({s.branch})
                  </button>
                ))}
              </div>
            )}
            <span
              className="table-subtext"
              style={{ display: 'block', marginTop: '6px' }}
            >
              Eligible 3rd year cohort: {eligibleCohort.length} students loaded.
            </span>
          </div>

          {/* Turnout select buttons */}
          <div className="form-group">
            <label>Turnout Attendance Slot Mode</label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                gap: '10px',
                marginTop: '8px',
              }}
            >
              {[
                { value: 'BOTH', label: 'Both Sessions', sub: 'MS & AS' },
                { value: 'MS', label: 'Morning Only', sub: 'MS Slot' },
                { value: 'AS', label: 'Afternoon Only', sub: 'AS Slot' },
                { value: 'ABSENT', label: 'Absent', sub: '0% turnout' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '12px 10px',
                    borderRadius: '6px',
                    border:
                      sessionTurnout === opt.value
                        ? '2px solid var(--color-primary)'
                        : '1px solid var(--color-border)',
                    backgroundColor:
                      sessionTurnout === opt.value ? 'var(--color-primary)' : '#ffffff',
                    color:
                      sessionTurnout === opt.value ? '#ffffff' : 'var(--color-slate-700)',
                    fontWeight: 'bold',
                    boxShadow:
                      sessionTurnout === opt.value
                        ? '0 2px 8px rgba(139, 30, 30, 0.2)'
                        : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onClick={() => setSessionTurnout(opt.value as any)}
                >
                  <span style={{ fontSize: '13px' }}>{opt.label}</span>
                  <span
                    style={{
                      fontSize: '10px',
                      opacity: sessionTurnout === opt.value ? 0.9 : 0.6,
                      marginTop: '2px',
                    }}
                  >
                    {opt.sub}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            className="btn-primary"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '14.5px',
              marginTop: '8px',
            }}
          >
            {submitting ? 'Recording Turnout...' : 'Submit Turnout'}
          </button>
        </form>
      </article>
    </div>
  );
};

export default TrainingFastMarkPage;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';

import { studentsAPI, StudentProfile } from '../services/api';

interface PlacementDrive {
  id: number;
  opportunityId: number;
  opportunityName: string;
  name: string;
  date: string;
  attendance: Record<number, 'Present' | 'Absent' | 'Late'>;
}

const PlacementDriveFastMarkPage: React.FC = () => {
  const { driveId } = useParams<{ driveId: string }>();
  const navigate = useNavigate();

  const [drives, setDrives] = useState<PlacementDrive[]>([]);
  const [currentDrive, setCurrentDrive] = useState<PlacementDrive | null>(null);
  const [rollNumber, setRollNumber] = useState('');
  const [sessionTurnout, setSessionTurnout] = useState<'Present' | 'Absent' | 'Late'>('Present');
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Fetch student list to resolve details (names, branches, division, etc.)
  const studentsQuery = useQuery(
    ['students-list-drive-fast-mark'],
    async () => {
      const response = await studentsAPI.list(1, '');
      return response.data?.results || [];
    }
  );

  const studentsList: StudentProfile[] = studentsQuery.data || [];

  // Load drives from localStorage
  useEffect(() => {
    try {
      const storedDrives = localStorage.getItem('placement_crm_drives');
      if (storedDrives) {
        const parsed = JSON.parse(storedDrives) as PlacementDrive[];
        setDrives(parsed);
        const target = parsed.find(d => d.id === Number(driveId));
        if (target) {
          setCurrentDrive(target);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [driveId]);

  const saveDrivesList = (updated: PlacementDrive[]) => {
    setDrives(updated);
    localStorage.setItem('placement_crm_drives', JSON.stringify(updated));
  };

  // Filter cohort down to students imported into this drive's roster!
  const eligibleCohort = studentsList.filter((s) => {
    if (!currentDrive) return false;
    return currentDrive.attendance[s.id] !== undefined;
  });

  const handleMarkAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmationMessage('');
    setErrorMessage('');

    if (!rollNumber) {
      alert('Please select or enter a student roll number.');
      return;
    }

    if (!currentDrive) return;

    const resolvedStudent = eligibleCohort.find(
      s => s.college_roll_no.trim().toLowerCase() === rollNumber.trim().toLowerCase()
    );

    if (!resolvedStudent) {
      alert(`Student with Roll Number "${rollNumber}" is not imported into this drive's applicant roster.`);
      return;
    }

    setSubmitting(true);

    try {
      const updatedDrives = drives.map(d => {
        if (d.id === currentDrive.id) {
          return {
            ...d,
            attendance: {
              ...d.attendance,
              [resolvedStudent.id]: sessionTurnout
            }
          };
        }
        return d;
      });

      saveDrivesList(updatedDrives);

      // Sync active page state
      const nextDrive = updatedDrives.find(d => d.id === currentDrive.id);
      if (nextDrive) {
        setCurrentDrive(nextDrive);
      }

      setConfirmationMessage(`updated attendance for ${resolvedStudent.college_roll_no} (${resolvedStudent.full_name}) as ${sessionTurnout.toUpperCase()}`);
      setRollNumber('');
      setSearchQuery('');
    } catch (err) {
      setErrorMessage(`Error marking ${rollNumber}.`);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter suggestions
  const filteredSuggestions = eligibleCohort.filter((s) => {
    const search = searchQuery.toLowerCase().trim();
    if (!search) return false;
    return s.college_roll_no.toLowerCase().includes(search) || s.full_name.toLowerCase().includes(search);
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
            onClick={() => navigate('/placements', { state: { activeTab: 'attendance' } })}
          >
            ← Back to Placements Board
          </button>
          <h1 style={{ textAlign: 'left' }}>Drive Fast Attendance</h1>
          <p className="text-secondary" style={{ textAlign: 'left' }}>Log rapid daily placement turnout logs by roll number.</p>
        </div>
      </section>

      {/* Main Card */}
      <article className="card" style={{ display: 'grid', gap: '20px', width: '100%', maxWidth: '600px' }}>
        <div>
          <span className="service-eyebrow">
            Drive: {currentDrive?.opportunityName}
          </span>
          <h2 style={{ fontSize: '20px', marginTop: '4px' }}>
            {currentDrive?.name || 'Loading Drive...'}
          </h2>
          <p className="text-secondary" style={{ fontSize: '13px', margin: 0 }}>
            Scheduled Date: {currentDrive?.date} | Candidates Imported: {eligibleCohort.length}
          </p>
        </div>

        {/* Success confirmation */}
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
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            <span style={{ fontSize: '16px' }}>✓</span> {confirmationMessage}
          </div>
        )}

        {/* Error notification */}
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
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            <span style={{ fontSize: '16px' }}>⚠</span> {errorMessage}
          </div>
        )}

        <form onSubmit={handleMarkAttendance} style={{ display: 'grid', gap: '20px' }}>
          
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
              placeholder="Search Roll Number or Candidate Name..."
              style={{ width: '100%', padding: '10px 12px', fontSize: '14px', borderRadius: '6px' }}
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
                  overflowY: 'auto'
                }}
              >
                {filteredSuggestions.map((s) => (
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
                      fontSize: '13px'
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
            <span className="table-subtext" style={{ display: 'block', marginTop: '6px' }}>
              Imported applicants in drive cohort: {eligibleCohort.length} students.
            </span>
          </div>

          <div className="form-group">
            <label>Mark Turnout State</label>
            <div 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', 
                gap: '10px', 
                marginTop: '8px' 
              }}
            >
              {[
                { value: 'Present', label: 'Present', sub: 'On Time' },
                { value: 'Absent', label: 'Absent', sub: 'Not turnouts' },
                { value: 'Late', label: 'Late', sub: 'Excused Late' }
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
                    border: sessionTurnout === opt.value 
                      ? '2px solid var(--color-primary)' 
                      : '1px solid var(--color-border)',
                    backgroundColor: sessionTurnout === opt.value 
                      ? 'var(--color-primary)' 
                      : '#ffffff',
                    color: sessionTurnout === opt.value 
                      ? '#ffffff' 
                      : 'var(--color-slate-700)',
                    fontWeight: 'bold',
                    boxShadow: sessionTurnout === opt.value 
                      ? '0 2px 8px rgba(139, 30, 30, 0.2)' 
                      : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => setSessionTurnout(opt.value as any)}
                >
                  <span style={{ fontSize: '13px' }}>{opt.label}</span>
                  <span style={{ fontSize: '10px', opacity: sessionTurnout === opt.value ? 0.9 : 0.6, marginTop: '2px' }}>{opt.sub}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={submitting}
            style={{ width: '100%', padding: '12px', fontSize: '14.5px', marginTop: '8px' }}
          >
            {submitting ? 'Recording Turnout...' : 'Submit Attendance'}
          </button>
        </form>
      </article>

    </div>
  );
};

export default PlacementDriveFastMarkPage;

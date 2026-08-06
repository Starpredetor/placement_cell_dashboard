import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { studentsAPI, StudentProfile } from '../services/api';

interface EventAnnouncement {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  speaker: string;
  
  sessionType: 'ONLINE' | 'OFFLINE';
  meetingLink?: string;
  topic: string;
  registrationLink?: string;
  attire: string;
  notes: string;
  deadline?: string;
}

const DEFAULT_EVENTS: EventAnnouncement[] = [
  {
    id: 1,
    title: 'Orientation seminar: Career Tracks in Software Engineering',
    description: 'A comprehensive session covering full-stack, DevOps, mobile dev, and data science career paths and preparation strategies.',
    date: 'Jun 3, 2026',
    time: '3:00 PM - 5:00 PM',
    venue: 'Main Auditorium',
    speaker: 'Alumni Lead, BigTech Corp',
    sessionType: 'OFFLINE',
    topic: 'Career Roadmaps & Interview Strategy',
    attire: 'Formal Attire Recommended',
    notes: 'Please bring a notebook and report to the auditorium 15 minutes early.',
    registrationLink: 'https://forms.gle/orient-register-2026',
    deadline: 'Jun 2, 2026 by 5:00 pm'
  },
  {
    id: 2,
    title: 'Resume & Interview Bootcamp: Crack the Technical rounds',
    description: 'Hands-on workshop to critique resumes, evaluate ATS scores, and practice mock coding problems in teams.',
    date: 'Jun 7, 2026',
    time: '1:00 PM - 3:00 PM',
    venue: 'Seminar Hall B',
    speaker: 'TPO Priya Sharma',
    sessionType: 'OFFLINE',
    topic: 'ATS Optimization & Coding Rounds Prep',
    attire: 'Smart Casual / Formal Dress',
    notes: 'Highly recommended to carry a printed draft of your resume for critiques.',
    registrationLink: 'https://forms.gle/bootcamp-register-2026',
    deadline: 'Jun 6, 2026 by 12:00 pm'
  }
];

const EventsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventAnnouncement[]>([]);
  const [enrollments, setEnrollments] = useState<Record<string, any>>({});
  
  // Selected event for volunteer roster
  const [selectedAdminEvent, setSelectedAdminEvent] = useState<EventAnnouncement | null>(null);

  const canManageEvents = user?.role === 'SUPER_ADMIN' || user?.role === 'TPO' || user?.role === 'HOD';

  // Fetch logged in student details
  const studentMeQuery = useQuery(
    ['student-profile-me-events'],
    async () => {
      const response = await studentsAPI.me();
      return response.data;
    },
    { enabled: user?.role === 'STUDENT', retry: false }
  );

  // Fetch student roster to register attendance
  const studentListQuery = useQuery(
    ['students-list-events'],
    async () => {
      const response = await studentsAPI.list(1, '');
      return response.data?.results || [];
    },
    { enabled: user?.role !== 'STUDENT' }
  );

  // Load from local storage
  useEffect(() => {
    try {
      const storedEvents = localStorage.getItem('placement_crm_events');
      if (storedEvents) {
        setEvents(JSON.parse(storedEvents));
      } else {
        localStorage.setItem('placement_crm_events', JSON.stringify(DEFAULT_EVENTS));
        setEvents(DEFAULT_EVENTS);
      }

      const storedEnrollments = localStorage.getItem('placement_crm_enrollments');
      if (storedEnrollments) {
        setEnrollments(JSON.parse(storedEnrollments));
      } else {
        // Initial mock enrollment
        const initialEnrollments = {
          '1-1': { studentId: 1, studentName: 'Aarav Patil', status: 'Enrolled' }
        };
        localStorage.setItem('placement_crm_enrollments', JSON.stringify(initialEnrollments));
        setEnrollments(initialEnrollments);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const saveEvents = (newEventsList: EventAnnouncement[]) => {
    setEvents(newEventsList);
    localStorage.setItem('placement_crm_events', JSON.stringify(newEventsList));
  };

  const saveEnrollments = (newEnrollmentsList: Record<string, any>) => {
    setEnrollments(newEnrollmentsList);
    localStorage.setItem('placement_crm_enrollments', JSON.stringify(newEnrollmentsList));
  };

  const isEventToday = (dateStr: string) => {
    if (!dateStr) return false;
    const today = new Date();
    const options = { month: 'short', day: 'numeric', year: 'numeric' } as const;
    const format1 = today.toLocaleDateString('en-US', options); // e.g. "May 31, 2026"
    const format2 = today.toISOString().split('T')[0]; // e.g. "2026-05-31"
    const term = dateStr.trim().toLowerCase();
    return term.includes(format1.toLowerCase()) || term.includes(format2) || term === 'today';
  };

  const isPastEvent = (dateStr: string) => {
    if (!dateStr) return false;
    if (isEventToday(dateStr)) return false;
    const todayObj = new Date();
    const yyyy = todayObj.getFullYear();
    const mm = String(todayObj.getMonth() + 1).padStart(2, '0');
    const dd = String(todayObj.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    
    const normalizedDate = dateStr.trim().toLowerCase();
    if (normalizedDate.includes('today')) return false;
    try {
      const eventTime = new Date(dateStr).getTime();
      const todayTime = new Date(todayStr).getTime();
      return eventTime < todayTime;
    } catch (e) {
      return normalizedDate < todayStr;
    }
  };

  const handleEnroll = (eventId: number) => {
    const student = studentMeQuery.data;
    if (!student) return;

    const enrollKey = `${eventId}-${student.id}`;
    const newEnrollments = {
      ...enrollments,
      [enrollKey]: {
        studentId: student.id,
        studentName: student.full_name,
        status: 'Enrolled'
      }
    };
    saveEnrollments(newEnrollments);
    alert('Successfully enrolled in event!');
  };



  const handleMarkAttendance = (eventId: number, studentId: number, status: string) => {
    const enrollKey = `${eventId}-${studentId}`;
    const target = enrollments[enrollKey];
    if (!target) return;

    const updatedEnrollments = {
      ...enrollments,
      [enrollKey]: {
        ...target,
        status
      }
    };
    saveEnrollments(updatedEnrollments);
  };

  const renderEventDetailView = (event: EventAnnouncement) => {
    const todayGlow = isEventToday(event.date);
    const pastGlow = isPastEvent(event.date);
    const student = studentMeQuery.data;
    const enrollKey = `${event.id}-${student?.id}`;
    const hasEnrolled = !!enrollments[enrollKey];
    const status = enrollments[enrollKey]?.status || 'Available';
    const isOnline = event.sessionType === 'ONLINE';

    return (
      <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
        <button
          type="button"
          className="btn-secondary"
          style={{ justifySelf: 'start', padding: '8px 14px', fontSize: '13px' }}
          onClick={() => setSelectedAdminEvent(null)}
        >
          ← Back to Seminars Grid
        </button>

        <article className="card" style={{ display: 'grid', gap: '24px', padding: 'var(--space-lg)' }}>
          {/* Header Banner */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span className="opportunity-company" style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-primary)' }}>Speaker: {event.speaker}</span>
                <span className={`badge ${isOnline ? 'badge-extended' : 'badge-applied'}`} style={{ fontSize: '11px' }}>
                  {isOnline ? '💻 ONLINE WEBINAR' : '📍 IN-PERSON HALL'}
                </span>
                {todayGlow && <span className="badge badge-today-pulse" style={{ fontSize: '10px' }}>TODAY</span>}
                {pastGlow && <span className="badge" style={{ fontSize: '10px', background: 'var(--color-slate-200)', color: 'var(--color-slate-600)' }}>EXPIRED</span>}
              </div>
              <h1 style={{ fontSize: '24px', margin: '6px 0 4px 0', color: 'var(--color-slate-900)' }}>{event.title}</h1>
              <p className="text-secondary" style={{ margin: 0, fontSize: '13.5px' }}>
                <strong>Focus Topic:</strong> {event.topic || 'Industry Readiness Guidance'}
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {user?.role === 'STUDENT' ? (
                hasEnrolled ? (
                  <span className="badge badge-active" style={{ padding: '10px 18px', fontSize: '14px', borderRadius: '8px' }}>
                    Enrolled ({status})
                  </span>
                ) : pastGlow ? (
                  <span className="badge" style={{ padding: '10px 18px', fontSize: '14px', borderRadius: '8px', background: 'var(--color-slate-200)', color: 'var(--color-slate-600)' }}>
                    Closed
                  </span>
                ) : (
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ background: 'var(--color-accent)' }}
                    onClick={() => handleEnroll(event.id)}
                    disabled={studentMeQuery.isLoading}
                  >
                    Enroll in Seminar
                  </button>
                )
              ) : null}
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 style={{ fontSize: '15px', color: 'var(--color-slate-800)', marginBottom: '8px' }}>Session Objectives</h3>
            <p style={{ margin: 0, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{event.description}</p>
          </div>

          {/* Twin Info Grid: Schedule & Logistics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            
            {/* Schedule Card */}
            <div className="card" style={{ border: '1px solid var(--color-border)', padding: '16px', background: 'var(--color-bg-main)' }}>
              <h3 style={{ fontSize: '15px', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                📅 Event Timings & Venue
              </h3>
              
              <div style={{ display: 'grid', gap: '10px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px' }}>
                  <span className="text-secondary">Schedule Date</span>
                  <strong style={{ color: 'var(--color-slate-900)' }}>{event.date}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px' }}>
                  <span className="text-secondary">Timings</span>
                  <strong style={{ color: 'var(--color-slate-900)' }}>{event.time}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px' }}>
                  <span className="text-secondary">{isOnline ? 'Webinar Join Link' : 'Seminar Classroom/Hall'}</span>
                  {isOnline ? (
                    <a href={event.meetingLink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent)', fontWeight: 'bold' }}>
                      Join Meeting Link ↗
                    </a>
                  ) : (
                    <strong style={{ color: 'var(--color-slate-900)' }}>{event.venue}</strong>
                  )}
                </div>
              </div>
            </div>

            {/* Attendance & Attire Guidelines */}
            <div className="card" style={{ border: '1px solid var(--color-border)', padding: '16px', background: 'var(--color-bg-main)', display: 'grid', alignContent: 'start', gap: '12px' }}>
              <h3 style={{ fontSize: '15px', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                👕 Recommended Dress Attire & Guidelines
              </h3>
              
              <div style={{ display: 'grid', gap: '8px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px' }}>
                  <span className="text-secondary">Dress Attire Code</span>
                  <strong style={{ color: 'var(--color-slate-900)' }}>{event.attire || 'Formal Dress Attire'}</strong>
                </div>
                {event.deadline && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px' }}>
                    <span className="text-secondary">Registration Deadline</span>
                    <strong style={{ color: 'var(--color-slate-900)' }}>{event.deadline}</strong>
                  </div>
                )}
              </div>

              <div style={{ background: 'rgba(13, 148, 136, 0.05)', padding: '10px 14px', borderRadius: '6px', borderLeft: '4px solid var(--color-accent)', fontSize: '12.5px' }}>
                <strong style={{ color: 'var(--color-accent)', display: 'block', marginBottom: '2px' }}>💡 Mandatory Instructions</strong>
                {event.notes || 'Students must report to the venue 15 minutes prior to the given time.'}
              </div>
            </div>

          </div>

          {/* Registration External Links */}
          {event.registrationLink && (
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '24px', background: 'rgba(15, 23, 42, 0.02)', padding: '16px', borderRadius: '8px' }}>
              <div style={{ minWidth: '150px' }}>
                <span className="text-secondary" style={{ fontSize: '11px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Registration Link</span>
                <a href={event.registrationLink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 'bold', fontSize: '13px' }}>
                  Connect Session Endpoint URL ↗
                </a>
              </div>
            </div>
          )}
        </article>

        {/* Turnout coordinate sheet integrated below the detail summary card for Admin view */}
        {user?.role !== 'STUDENT' && (
          <article className="card" style={{ display: 'grid', gap: '14px', marginTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '18px', margin: 0 }}>Enrolled Attendees Attendance Sheet</h2>
                <p className="text-secondary" style={{ margin: 0, fontSize: '13px' }}>Confirm physical or online turnouts for the registered cohort.</p>
              </div>
            </div>

            <div className="student-directory-table-wrapper" style={{ marginTop: '10px' }}>
              <table className="student-directory-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Roll Number</th>
                    <th>Seminar Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(enrollments)
                    .filter(key => key.startsWith(`${event.id}-`))
                    .map(key => {
                      const enroll = enrollments[key];
                      const studentDetail = studentsList.find(s => s.id === enroll.studentId);

                      return (
                        <tr key={key}>
                          <td>
                            <strong>{enroll.studentName}</strong>
                            <span className="table-subtext">{studentDetail?.branch || 'Branch loading...'}</span>
                          </td>
                          <td><code>{studentDetail?.college_roll_no || 'N/A'}</code></td>
                          <td>
                            <select
                              value={enroll.status}
                              style={{ padding: '6px', fontSize: '12.5px', borderRadius: '4px' }}
                              onChange={(e) => handleMarkAttendance(event.id, enroll.studentId, e.target.value)}
                            >
                              <option value="Enrolled">Enrolled</option>
                              <option value="Present">Present</option>
                              <option value="Absent">Absent</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  {Object.keys(enrollments).filter(key => key.startsWith(`${event.id}-`)).length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', padding: '18px' }}>
                        There are currently no enrolled student applications for this seminar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>
        )}
      </div>
    );
  };

  // 1. STUDENT VIEW
  const renderStudentView = () => {
    const student = studentMeQuery.data;
    
    if (selectedAdminEvent) {
      return renderEventDetailView(selectedAdminEvent);
    }

    return (
      <div style={{ display: 'grid', gap: 'var(--space-lg)' }}>
        <section className="page-header">
          <div>
            <h1>Seminars & Events Board</h1>
            <p className="text-secondary">Enroll in guest lectures, industry seminars, and mock camps scheduled by the TPO cell.</p>
          </div>
        </section>

        <div style={{ display: 'grid', gap: 'var(--space-md)', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          {events.map((event) => {
            const enrollKey = `${event.id}-${student?.id}`;
            const hasEnrolled = !!enrollments[enrollKey];
            const status = enrollments[enrollKey]?.status || 'Available';
            const todayGlow = isEventToday(event.date);
            const pastGlow = isPastEvent(event.date);
            const isOnline = event.sessionType === 'ONLINE';

            return (
              <article className={`opportunity-card ${pastGlow ? 'is-past-event' : ''}`} key={event.id}>
                <div className="opportunity-header">
                  <div>
                    <span className="opportunity-company" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      Speaker: {event.speaker}
                      {todayGlow && (
                        <span className="badge badge-today-pulse" style={{ fontSize: '9px', padding: '2px 6px' }}>TODAY</span>
                      )}
                    </span>
                    <h2 className="opportunity-title" style={{ fontSize: '16px', margin: '4px 0 8px 0' }}>{event.title}</h2>
                  </div>
                  <span className={`badge ${hasEnrolled ? 'badge-active' : pastGlow ? 'badge-alumni' : 'badge-eligible'}`}>
                    {hasEnrolled ? status : pastGlow ? 'Closed' : isOnline ? 'Online' : 'In-person'}
                  </span>
                </div>

                <p className="text-secondary" style={{ fontSize: '13px', margin: '4px 0 12px 0', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {event.description}
                </p>

                <div className="opportunity-details" style={{ fontSize: '12px' }}>
                  <span>Date: {event.date}</span>
                  <span>Time: {event.time}</span>
                  <span>Venue: {event.venue}</span>
                </div>

                <div className="opportunity-actions" style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => setSelectedAdminEvent(event)}
                  >
                    View Details
                  </button>
                  {hasEnrolled ? (
                    <button type="button" className="btn-secondary" disabled style={{ flex: 1, justifyContent: 'center' }}>
                      Enrolled
                    </button>
                  ) : pastGlow ? (
                    <button type="button" className="btn-secondary" disabled style={{ flex: 1, justifyContent: 'center' }}>
                      Event Expired
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ flex: 1, justifyContent: 'center' }}
                      onClick={() => handleEnroll(event.id)}
                      disabled={studentMeQuery.isLoading}
                    >
                      Enroll in Seminar
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    );
  };

  // 2. ADMIN/VOLUNTEER VIEW
  const renderAdminView = () => {
    return (
      <div style={{ display: 'grid', gap: 'var(--space-lg)' }}>
        <section className="page-header" style={{ margin: 0, padding: 0 }}>
          <div>
            <h1>Events & Seminar Management</h1>
            <p className="text-secondary" style={{ margin: 0 }}>Announce new guest lectures, bootcamps, and mock review drives, and check off turnout checklists.</p>
          </div>
          {canManageEvents && (
            <button 
              type="button" 
              className="btn-primary" 
              onClick={() => navigate('/events/create')}
            >
              Announce Seminar
            </button>
          )}
        </section>

        {selectedAdminEvent ? (
          renderEventDetailView(selectedAdminEvent)
        ) : (
          <div style={{ display: 'grid', gap: 'var(--space-md)', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}>
            {events.map(event => {
              const enrollCount = Object.keys(enrollments).filter(key => key.startsWith(`${event.id}-`)).length;
              const todayGlow = isEventToday(event.date);
              const pastGlow = isPastEvent(event.date);
              const isOnline = event.sessionType === 'ONLINE';
              return (
                <article className={`opportunity-card animate-scaleUp ${pastGlow ? 'is-past-event' : ''}`} key={event.id}>
                  <div className="opportunity-header">
                    <div>
                      <span className="opportunity-company" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        Speaker: {event.speaker}
                        {todayGlow && (
                          <span className="badge badge-today-pulse" style={{ fontSize: '9px', padding: '2px 6px' }}>TODAY</span>
                        )}
                      </span>
                      <h2 className="opportunity-title" style={{ fontSize: '16px', margin: '4px 0' }}>{event.title}</h2>
                    </div>
                    <span className="badge badge-applied">{enrollCount} Enrolled</span>
                  </div>

                  <p className="text-secondary" style={{ fontSize: '12.5px', margin: '4px 0 10px 0', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {event.description}
                  </p>

                  <div className="opportunity-details" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                    <span>Date: {event.date}</span>
                    <span>Venue: {event.venue}</span>
                  </div>

                  <div className="opportunity-actions" style={{ marginTop: '8px' }}>
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={() => setSelectedAdminEvent(event)}
                    >
                      View Details
                    </button>
                  </div>
                </article>
              );
            })}
            {events.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '36px', color: 'var(--color-slate-400)', fontStyle: 'italic' }}>
                No guest seminars or events scheduled.
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return user?.role === 'STUDENT' ? renderStudentView() : renderAdminView();
};

export default EventsPage;

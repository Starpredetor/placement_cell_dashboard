import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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

const EventSeminarCreatePage: React.FC = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [venue, setVenue] = useState('');
  const [speaker, setSpeaker] = useState('');
  const [sessionType, setSessionType] = useState<'ONLINE' | 'OFFLINE'>('OFFLINE');
  const [meetingLink, setMeetingLink] = useState('');
  const [topic, setTopic] = useState('');
  const [registrationLink, setRegistrationLink] = useState('');
  const [attire, setAttire] = useState('Formal Attire');
  const [notes, setNotes] = useState('Students must report to the venue 15 minutes prior to the given time.');
  const [deadline, setDeadline] = useState('');
  
  const [saving, setSaving] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !desc || !date || !time || !speaker || !topic) {
      alert('Please fill out all mandatory fields (Title, Topic, Speaker, Date, and Time).');
      return;
    }

    if (sessionType === 'OFFLINE' && !venue) {
      alert('Please specify a physical Classroom/Auditorium Venue for this Offline session.');
      return;
    }

    if (sessionType === 'ONLINE' && !meetingLink) {
      alert('Please provide a meeting join link for this Online webinar.');
      return;
    }

    setSaving(true);
    try {
      const storedEvents = localStorage.getItem('placement_crm_events');
      const eventsList: EventAnnouncement[] = storedEvents ? JSON.parse(storedEvents) : [];

      const newEvent: EventAnnouncement = {
        id: Date.now(),
        title,
        description: desc,
        date,
        time,
        venue: sessionType === 'OFFLINE' ? venue : 'Online Webinar',
        speaker,
        
        sessionType,
        meetingLink: sessionType === 'ONLINE' ? meetingLink : undefined,
        topic,
        registrationLink: registrationLink || undefined,
        attire,
        notes,
        deadline: deadline || undefined
      };

      localStorage.setItem('placement_crm_events', JSON.stringify([...eventsList, newEvent]));
      alert('Campus Seminar connect session announced successfully!');
      navigate('/events');
    } catch (err) {
      console.error(err);
      alert('Failed to announce seminar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 'var(--space-lg)', justifyItems: 'center' }}>
      <section className="page-header" style={{ width: '100%', maxWidth: '750px' }}>
        <div style={{ width: '100%' }}>
          <button 
            type="button" 
            className="btn-secondary" 
            style={{ marginBottom: '12px', padding: '6px 12px', fontSize: '12.5px' }}
            onClick={() => navigate('/events')}
          >
            ← Back to Seminars Board
          </button>
          <h1 style={{ textAlign: 'left' }}>Announce Campus Seminar / Connect Session</h1>
          <p className="text-secondary" style={{ textAlign: 'left' }}>Schedule guest lectures, webinars, and technical career connect briefings.</p>
        </div>
      </section>

      <article className="card" style={{ width: '100%', maxWidth: '750px', padding: 'var(--space-lg)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
          
          <h3 style={{ borderBottom: '2px solid var(--color-slate-100)', paddingBottom: '8px', color: 'var(--color-primary)' }}>1. Session Profile</h3>
          <div className="student-form-grid">
            <label className="form-group">
              Seminar / Event Title *
              <input 
                type="text" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="e.g. Careers in Cloud Engineering & DevOps" 
                required
              />
            </label>
            <label className="form-group">
              Core Topic / Focus *
              <input 
                type="text" 
                value={topic} 
                onChange={e => setTopic(e.target.value)} 
                placeholder="e.g. AWS Core Services & Infrastructure" 
                required
              />
            </label>
            <label className="form-group">
              Invited Speaker Name & Title *
              <input 
                type="text" 
                value={speaker} 
                onChange={e => setSpeaker(e.target.value)} 
                placeholder="e.g. Amit Kumar (Senior Principal Architect, AWS)" 
                required
              />
            </label>
            <label className="form-group">
              Session Delivery Format *
              <select 
                value={sessionType} 
                onChange={e => setSessionType(e.target.value as any)}
                required
              >
                <option value="OFFLINE">Offline (In-person Hall)</option>
                <option value="ONLINE">Online (Webinar / Stream)</option>
              </select>
            </label>
          </div>

          <h3 style={{ borderBottom: '2px solid var(--color-slate-100)', paddingBottom: '8px', color: 'var(--color-primary)', marginTop: '8px' }}>2. Schedule & Delivery Logistics</h3>
          <div className="student-form-grid">
            <label className="form-group">
              Session Date *
              <input 
                type="text" 
                value={date} 
                onChange={e => setDate(e.target.value)} 
                placeholder="e.g. Jun 15, 2026" 
                required
              />
            </label>
            <label className="form-group">
              Event Timings *
              <input 
                type="text" 
                value={time} 
                onChange={e => setTime(e.target.value)} 
                placeholder="e.g. 2:00 PM - 4:00 PM" 
                required
              />
            </label>

            {sessionType === 'OFFLINE' ? (
              <label className="form-group">
                Auditorium / Classroom Venue *
                <input 
                  type="text" 
                  value={venue} 
                  onChange={e => setVenue(e.target.value)} 
                  placeholder="e.g. Main Auditorium Hall B" 
                  required
                />
              </label>
            ) : (
              <label className="form-group">
                Online Meeting Join Link *
                <input 
                  type="url" 
                  value={meetingLink} 
                  onChange={e => setMeetingLink(e.target.value)} 
                  placeholder="e.g. https://teams.microsoft.com/..." 
                  required
                />
              </label>
            )}

            <label className="form-group">
              Recommended Dress Attire
              <input 
                type="text" 
                value={attire} 
                onChange={e => setAttire(e.target.value)} 
                placeholder="e.g. Formal Attire / Casual" 
              />
            </label>
          </div>

          <h3 style={{ borderBottom: '2px solid var(--color-slate-100)', paddingBottom: '8px', color: 'var(--color-primary)', marginTop: '8px' }}>3. Registration Requirements</h3>
          <div className="student-form-grid">
            <label className="form-group">
              External Registration Endpoint Link
              <input 
                type="url" 
                value={registrationLink} 
                onChange={e => setRegistrationLink(e.target.value)} 
                placeholder="e.g. https://forms.gle/seminarRegister" 
              />
            </label>
            <label className="form-group">
              Registration Close Deadline Date & Time
              <input 
                type="text" 
                value={deadline} 
                onChange={e => setDeadline(e.target.value)} 
                placeholder="e.g. Jun 14, 2026 by 5:00 pm" 
              />
            </label>
          </div>

          <div className="student-form-grid">
            <label className="form-group">
              Connect Session Objectives & Target Audience *
              <textarea 
                value={desc} 
                onChange={e => setDesc(e.target.value)} 
                placeholder="Provide a detailed brief of the webinar core goals..." 
                required
                rows={3}
              />
            </label>
            <label className="form-group">
              Important Reporting Notes & Instructions
              <textarea 
                value={notes} 
                onChange={e => setNotes(e.target.value)} 
                placeholder="e.g. Students must report prior..." 
                rows={3}
              />
            </label>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--color-border)', paddingTop: '16px', marginTop: '8px' }}>
            <button type="button" className="btn-secondary" onClick={() => navigate('/events')}>Cancel</button>
            <button type="submit" className="btn-success" disabled={saving}>
              {saving ? 'Announcing connect session...' : 'Announce Session'}
            </button>
          </div>
        </form>
      </article>
    </div>
  );
};

export default EventSeminarCreatePage;

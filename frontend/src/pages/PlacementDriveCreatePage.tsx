import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface JobOpportunity {
  id: number;
  company: string;
  role: string;
}

interface PlacementDrive {
  id: number;
  opportunityId: number;
  opportunityName: string;
  name: string;
  date: string;
  attendance: Record<number, 'Present' | 'Absent' | 'Late'>;
}

const PlacementDriveCreatePage: React.FC = () => {
  const navigate = useNavigate();

  const [driveName, setDriveName] = useState('');
  const [driveDate, setDriveDate] = useState(new Date().toISOString().split('T')[0]);
  const [opportunityId, setOpportunityId] = useState<number>(0);
  const [jobs, setJobs] = useState<JobOpportunity[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      const storedJobs = localStorage.getItem('placement_crm_jobs');
      if (storedJobs) {
        setJobs(JSON.parse(storedJobs));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driveName || !opportunityId) {
      alert('Please fill out drive name and select an opportunity.');
      return;
    }

    setSaving(true);
    try {
      const selectedJob = jobs.find((j) => j.id === Number(opportunityId));
      if (!selectedJob) return;

      // --- Importer Engine ---
      // Fetch applied students lists
      const storedApps = localStorage.getItem('placement_crm_applications');
      const applications = storedApps ? JSON.parse(storedApps) : {};

      const driveApplicants = Object.keys(applications)
        .filter((key) => key.startsWith(`${opportunityId}-`))
        .map((key) => applications[key]);

      const attendanceRecords: Record<number, 'Present' | 'Absent' | 'Late'> = {};
      driveApplicants.forEach((app) => {
        attendanceRecords[app.studentId] = 'Present'; // Default turnout Present
      });

      const storedDrives = localStorage.getItem('placement_crm_drives');
      const drivesList: PlacementDrive[] = storedDrives ? JSON.parse(storedDrives) : [];

      const newDrive: PlacementDrive = {
        id: Date.now(),
        opportunityId: selectedJob.id,
        opportunityName: selectedJob.company,
        name: driveName,
        date: driveDate,
        attendance: attendanceRecords,
      };

      localStorage.setItem(
        'placement_crm_drives',
        JSON.stringify([...drivesList, newDrive]),
      );
      alert(
        `Placement Drive "${driveName}" created successfully! Imported ${Object.keys(attendanceRecords).length} candidates.`,
      );

      // Navigate back and request to activate the 'attendance' tab
      navigate('/placements', { state: { activeTab: 'attendance' } });
    } catch (err) {
      console.error(err);
      alert('Failed to save drive.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 'var(--space-lg)', justifyItems: 'center' }}>
      <section className="page-header" style={{ width: '100%', maxWidth: '600px' }}>
        <div style={{ width: '100%' }}>
          <button
            type="button"
            className="btn-secondary"
            style={{ marginBottom: '12px', padding: '6px 12px', fontSize: '12.5px' }}
            onClick={() => navigate('/placements')}
          >
            ← Back to Placements Board
          </button>
          <h1 style={{ textAlign: 'left' }}>Create Placement Drive</h1>
          <p className="text-secondary" style={{ textAlign: 'left' }}>
            Schedule a daily placement round. The system will auto-import all applied
            candidates instantly.
          </p>
        </div>
      </section>

      <article className="card" style={{ width: '100%', maxWidth: '600px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
          <label className="form-group">
            Drive / Round Name
            <input
              type="text"
              value={driveName}
              onChange={(e) => setDriveName(e.target.value)}
              placeholder="e.g. StartupX Aptitude Test Day"
              required
            />
          </label>

          <label className="form-group">
            Select Opportunity (Imports Applied Candidates)
            <select
              value={opportunityId}
              onChange={(e) => setOpportunityId(Number(e.target.value))}
              required
            >
              <option value="">-- Choose Job Opening --</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.company} - {j.role}
                </option>
              ))}
            </select>
          </label>

          <label className="form-group">
            Drive Date
            <input
              type="date"
              value={driveDate}
              onChange={(e) => setDriveDate(e.target.value)}
              required
            />
          </label>

          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              borderTop: '1px solid var(--color-border)',
              paddingTop: '16px',
            }}
          >
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/placements')}
            >
              Cancel
            </button>
            <button type="submit" className="btn-success" disabled={saving}>
              {saving ? 'Creating & Importing...' : 'Create & Import Candidates'}
            </button>
          </div>
        </form>
      </article>
    </div>
  );
};

export default PlacementDriveCreatePage;

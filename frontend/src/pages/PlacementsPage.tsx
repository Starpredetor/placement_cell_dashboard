import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { useNavigate, useLocation } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { studentsAPI, StudentProfile } from '../services/api';
import { getResumeForStudent } from './ProfilePage';

interface RoleDetail {
  title: string;
  ctc: string;
  stipend?: string;
  branches: string[];
  responsibilities: string;
  skills: string;
}

interface JobOpportunity {
  id: number;
  company: string;
  role: string;
  ctc: string;
  location: string;
  minCgpi: number;
  maxKts: number;
  branches: string[];
  
  batch: string;
  companyIntro: string;
  companyLink?: string;
  tenthPercent: string;
  twelfthPercent: string;
  stipend: string;
  
  hasBond: boolean;
  bondDuration?: string;
  bondPenalty?: string;
  
  hasMultipleRoles: boolean;
  multipleRoles: RoleDetail[];
  
  responsibilities: string;
  skills: string;
  selectionProcess: string;
  
  registrationLink?: string;
  deadline: string;
}

interface PlacementDrive {
  id: number;
  opportunityId: number;
  opportunityName: string;
  name: string;
  date: string;
  attendance: Record<number, 'Present' | 'Absent' | 'Late'>; // studentId -> status
}

const DEFAULT_JOBS: JobOpportunity[] = [
  {
    id: 1,
    company: 'StartupX',
    role: 'Graduate Engineer Trainee',
    ctc: '8.5 LPA',
    location: 'Pune',
    minCgpi: 6.5,
    maxKts: 0,
    branches: ['Computer Engineering (CE)', 'Information Technology (IT)'],
    batch: '2026',
    companyIntro: 'StartupX is an agile tech pioneer specializing in SaaS development and automation tooling for next-gen companies.',
    companyLink: 'https://startupx.example.com',
    tenthPercent: '60%',
    twelfthPercent: '60%',
    stipend: 'Rs. 25,000 / month',
    hasBond: true,
    bondDuration: '2 years',
    bondPenalty: 'Rs. 1,50,000',
    hasMultipleRoles: false,
    multipleRoles: [],
    responsibilities: '• Assist senior developers in product building.\n• Perform tests and documentation.\n• Support agile sprints and debugging sessions.',
    skills: '• Java, Python, or Go\n• Basics of databases and SQL\n• Good team communication skills',
    selectionProcess: '1. Resume screening & ATS evaluation\n2. Online aptitude round (Cognitive & Logics)\n3. Technical F2F interview (Leetcode medium)\n4. HR and Fitment rounds',
    registrationLink: 'https://elitmus.com/jobs/startupx-get',
    deadline: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0] + 'T17:00'
  },
  {
    id: 2,
    company: 'BigCorp Solutions',
    role: 'Software Analyst',
    ctc: '12.0 LPA',
    location: 'Mumbai (Hybrid)',
    minCgpi: 8.0,
    maxKts: 0,
    branches: ['Computer Engineering (CE)', 'Information Technology (IT)', 'Electronics and Telecommunications (EXTC)'],
    batch: '2026',
    companyIntro: 'BigCorp Solutions is a multinational engineering consulting firm operating massive enterprise tech infrastructures worldwide.',
    companyLink: 'https://bigcorp.example.com',
    tenthPercent: '75%',
    twelfthPercent: '70%',
    stipend: 'Rs. 45,000 / month',
    hasBond: false,
    hasMultipleRoles: true,
    multipleRoles: [
      {
        title: 'Backend Systems Engineer',
        ctc: '12.0 LPA',
        stipend: 'Rs. 45,000 / month',
        branches: ['Computer Engineering (CE)', 'Information Technology (IT)'],
        responsibilities: '• Develop ultra-low latency transaction backend APIs.\n• Optimize SQL queries and schema models.\n• Coordinate with DevOps on container scaling.',
        skills: '• Exceptional Python or C++ proficiency\n• Database indexing, Redis, PostgreSQL\n• AWS or GCP deployment principles'
      },
      {
        title: 'Full Stack Integration Specialist',
        ctc: '10.5 LPA',
        stipend: 'Rs. 35,000 / month',
        branches: ['Computer Engineering (CE)', 'Information Technology (IT)', 'Electronics and Telecommunications (EXTC)'],
        responsibilities: '• Integrate dashboard charts and analytics visualizations.\n• Maintain high responsive web performance across web apps.\n• Coordinate between frontend designs and REST APIs.',
        skills: '• React, TypeScript, TailwindCSS\n• Next.js or Node.js web frameworks\n• Basic UI/UX visual layout concepts'
      }
    ],
    responsibilities: '',
    skills: '',
    selectionProcess: '1. Coding Test (2 DSA Problems, 90 mins)\n2. Technical Interview Round 1 (System Design & OOP)\n3. Technical Interview Round 2 (Core Java/JS)\n4. HR Leadership Round',
    registrationLink: 'https://elitmus.com/jobs/bigcorp-2026',
    deadline: new Date(Date.now() + 86400000).toISOString().split('T')[0] + 'T17:00'
  }
];

const PlacementsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Tab Navigation: 'opportunities' | 'attendance'
  const [activeTab, setActiveTab] = useState<'opportunities' | 'attendance'>('opportunities');

  const [jobs, setJobs] = useState<JobOpportunity[]>([]);
  const [applications, setApplications] = useState<Record<string, any>>({});
  const [drives, setDrives] = useState<PlacementDrive[]>([]);
  const [selectedAdminJob, setSelectedAdminJob] = useState<JobOpportunity | null>(null);
  const [selectedDrive, setSelectedDrive] = useState<PlacementDrive | null>(null);
  const [activeRoleTab, setActiveRoleTab] = useState(0);

  // Sync tab redirect from separate creation pages
  useEffect(() => {
    if (location.state && (location.state as any).activeTab) {
      setActiveTab((location.state as any).activeTab);
    }
  }, [location.state]);

  const canManageOpenings = user?.role === 'SUPER_ADMIN' || user?.role === 'TPO' || user?.role === 'HOD' || user?.role === 'VOLUNTEER';
  const isStudent = user?.role === 'STUDENT';

  // Fetch logged in student details to evaluate eligibility
  const studentMeQuery = useQuery(
    ['student-profile-me-placements'],
    async () => {
      const response = await studentsAPI.me();
      return response.data;
    },
    { enabled: isStudent, retry: false }
  );

  const student = studentMeQuery.data;

  // Fetch student roster to list simulated applicants for admins
  const studentListQuery = useQuery(
    ['students-list-placements'],
    async () => {
      const response = await studentsAPI.list(1, '');
      return response.data?.results || [];
    },
    { enabled: !isStudent }
  );

  const studentsList = studentListQuery.data || [];

  // Load from local storage
  useEffect(() => {
    try {
      const storedJobs = localStorage.getItem('placement_crm_jobs');
      if (storedJobs) {
        setJobs(JSON.parse(storedJobs));
      } else {
        localStorage.setItem('placement_crm_jobs', JSON.stringify(DEFAULT_JOBS));
        setJobs(DEFAULT_JOBS);
      }

      const storedApps = localStorage.getItem('placement_crm_applications');
      let loadedApps = {};
      if (storedApps) {
        loadedApps = JSON.parse(storedApps);
        setApplications(loadedApps);
      } else {
        const initialApps = {
          '1-1': { studentId: 1, studentName: 'Aarav Patil', round: 'HR Round', status: 'Active', attendance: 'Present' }
        };
        localStorage.setItem('placement_crm_applications', JSON.stringify(initialApps));
        setApplications(initialApps);
        loadedApps = initialApps;
      }

      const storedDrives = localStorage.getItem('placement_crm_drives');
      if (storedDrives) {
        setDrives(JSON.parse(storedDrives));
      } else {
        // Seed default placement drive for StartupX
        const todayStr = new Date().toISOString().split('T')[0];
        const initialDrives: PlacementDrive[] = [
          {
            id: 1,
            opportunityId: 1,
            opportunityName: 'StartupX',
            name: 'StartupX Technical Test',
            date: todayStr,
            attendance: { 1: 'Present' } // Aarav Patil (studentId = 1) marked present
          }
        ];
        localStorage.setItem('placement_crm_drives', JSON.stringify(initialDrives));
        setDrives(initialDrives);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const saveJobs = (newJobsList: JobOpportunity[]) => {
    setJobs(newJobsList);
    localStorage.setItem('placement_crm_jobs', JSON.stringify(newJobsList));
  };

  const saveApplications = (newAppsList: Record<string, any>) => {
    setApplications(newAppsList);
    localStorage.setItem('placement_crm_applications', JSON.stringify(newAppsList));
  };

  const saveDrives = (newDrivesList: PlacementDrive[]) => {
    setDrives(newDrivesList);
    localStorage.setItem('placement_crm_drives', JSON.stringify(newDrivesList));
  };

  // Evaluate student eligibility
  const getEligibility = (student: StudentProfile | undefined, job: JobOpportunity) => {
    if (!student) return { eligible: false, reason: 'Profile loading...' };
    
    // Check branch
    const branches = job.branches || [];
    const hasBranch = branches.length === 0 || branches.includes(student.branch);
    if (!hasBranch) {
      return { eligible: false, reason: `Branch restricted. Eligible branches: ${branches.join(', ')}` };
    }

    // Check CGPI
    const cgpi = Number(student.academic_history?.se_cgpi || 0);
    if (cgpi < job.minCgpi) {
      return { eligible: false, reason: `CGPI threshold not met. Required: ${job.minCgpi} (Your CGPI: ${cgpi})` };
    }

    // Check KTs
    const liveKts = Number(student.academic_history?.live_kt || 0);
    if (liveKts > job.maxKts) {
      return { eligible: false, reason: `KT limits exceeded. Allowed: ${job.maxKts} (Your KTs: ${liveKts})` };
    }

    // Check 10th Marks
    if (job.tenthPercent && job.tenthPercent !== 'Open') {
      const studentTenth = Number(student.academic_history?.tenth_percentage || 0);
      const requiredTenth = Number(job.tenthPercent.replace(/%/g, ''));
      if (studentTenth < requiredTenth) {
        return { eligible: false, reason: `10th percentage threshold not met. Required: ${job.tenthPercent} (Your 10th: ${studentTenth}%)` };
      }
    }

    // Check 12th Marks
    if (job.twelfthPercent && job.twelfthPercent !== 'Open') {
      const studentTwelfth = Number(student.academic_history?.twelfth_or_diploma_percentage || 0);
      const requiredTwelfth = Number(job.twelfthPercent.replace(/%/g, ''));
      if (studentTwelfth < requiredTwelfth) {
        return { eligible: false, reason: `12th/Diploma percentage threshold not met. Required: ${job.twelfthPercent} (Your 12th/Diploma: ${studentTwelfth}%)` };
      }
    }

    return { eligible: true, reason: 'Eligible to Apply' };
  };

  const handleApply = (jobId: number) => {
    if (!student) return;

    const appKey = `${jobId}-${student.id}`;
    const newApps = {
      ...applications,
      [appKey]: {
        studentId: student.id,
        studentName: student.full_name,
        round: 'Aptitude Test',
        status: 'Active',
        attendance: 'Present'
      }
    };
    saveApplications(newApps);
    alert(`Successfully applied to ${jobs.find(j => j.id === jobId)?.company}! Your resume is linked.`);
  };

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany || !newRole || !newCtc || !newLocation) {
      alert('Please fill out all fields.');
      return;
    }

    const newJob: JobOpportunity = {
      id: Date.now(),
      company: newCompany,
      role: newRole,
      ctc: newCtc,
      location: newLocation,
      minCgpi: Number(newMinCgpi),
      maxKts: Number(newMaxKts),
      branches: selectedBranches.length > 0 ? selectedBranches : branchOptions
    };

    const updated = [...jobs, newJob];
    saveJobs(updated);
    
    // Reset form
    setNewCompany('');
    setNewRole('');
    setNewCtc('');
    setNewLocation('');
    setSelectedBranches([]);
    setShowAddForm(false);
    alert('Job opening created successfully!');
  };

  // Manage interview rounds for admins
  const handleUpdateApplicantStatus = (jobId: number, studentId: number, field: string, value: string) => {
    const appKey = `${jobId}-${studentId}`;
    const target = applications[appKey];
    if (!target) return;

    const updatedApps = {
      ...applications,
      [appKey]: {
        ...target,
        [field]: value
      }
    };
    saveApplications(updatedApps);
  };

  // Roster CSV Exporting featuring student resumes!
  const handleExportHR = (job: JobOpportunity) => {
    const studentRoster = studentsList;
    
    const applicantsList = Object.keys(applications)
      .filter(key => key.startsWith(`${job.id}-`))
      .map(key => {
        const app = applications[key];
        const studentDetail = studentRoster.find(s => s.id === app.studentId);
        const resumeFile = getResumeForStudent(app.studentId);
        
        return {
          id: app.studentId,
          name: app.studentName,
          roll_no: studentDetail?.college_roll_no || 'N/A',
          branch: studentDetail?.branch || 'N/A',
          division: studentDetail?.division || 'N/A',
          batch: studentDetail?.batch || 'N/A',
          cgpi: studentDetail?.academic_history?.se_cgpi || 'N/A',
          live_kt: studentDetail?.academic_history?.live_kt ?? 0,
          current_round: app.round,
          selection_status: app.status,
          resume_document: resumeFile ? resumeFile.filename : 'No resume uploaded'
        };
      });

    if (applicantsList.length === 0) {
      alert('There are currently no applicants for this opportunity to export.');
      return;
    }

    // Build CSV Content
    const headers = ['Student ID', 'Full Name', 'Roll Number', 'Branch', 'Division', 'Batch', 'CGPI', 'Live KTs', 'Current Round', 'Selection Status', 'Uploaded Resume Name'];
    const rows = applicantsList.map(a => [
      a.id,
      `"${a.name}"`,
      `"${a.roll_no}"`,
      `"${a.branch}"`,
      `"${a.division}"`,
      `"${a.batch}"`,
      a.cgpi,
      a.live_kt,
      `"${a.current_round}"`,
      `"${a.selection_status}"`,
      `"${a.resume_document}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HR_Roster_${job.company.replace(/\s+/g, '_')}_Applicants.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- PLACEMENT DRIVE DAILY ATTENDANCE MANAGEMENT ---

  const handleCreateDrive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriveName || !newDriveOpportunityId) {
      alert('Please enter a drive name and select the Placement Opportunity.');
      return;
    }

    const opportunity = jobs.find(j => j.id === Number(newDriveOpportunityId));
    if (!opportunity) return;

    // --- Dynamic Applicant Roster Importer ---
    // Finds all students who have applied to the selected opportunity
    const driveApplicants = Object.keys(applications)
      .filter(key => key.startsWith(`${newDriveOpportunityId}-`))
      .map(key => applications[key]);

    const attendanceRecords: Record<number, 'Present' | 'Absent' | 'Late'> = {};
    driveApplicants.forEach(app => {
      attendanceRecords[app.studentId] = 'Present'; // Default turnout is Present
    });

    const newDrive: PlacementDrive = {
      id: Date.now(),
      opportunityId: opportunity.id,
      opportunityName: opportunity.company,
      name: newDriveName,
      date: newDriveDate,
      attendance: attendanceRecords
    };

    const updated = [...drives, newDrive];
    saveDrives(updated);

    setNewDriveName('');
    setNewDriveOpportunityId(0);
    setShowAddDriveForm(false);
    setSelectedDrive(newDrive);
    alert(`Placement Drive "${newDriveName}" created successfully! Imported ${Object.keys(attendanceRecords).length} applicants.`);
  };

  const handleMarkDriveAttendance = (driveId: number, studentId: number, status: 'Present' | 'Absent' | 'Late') => {
    const updatedDrives = drives.map(d => {
      if (d.id === driveId) {
        return {
          ...d,
          attendance: {
            ...d.attendance,
            [studentId]: status
          }
        };
      }
      return d;
    });

    saveDrives(updatedDrives);
    // Sync current selection
    const target = updatedDrives.find(d => d.id === driveId);
    if (target) {
      setSelectedDrive(target);
    }
  };

  const branchOptions = [
    'Computer Engineering (CE)',
    'Computer Science Business Systems (CSBS)',
    'Computer Science and Engineering AI/ML (CSE AI/ML)',
    'Computer Science and Engineering AI/DS (CSE AI/DS)',
    'Computer Science and Engineering Cybersecurity (CSE CC)',
    'Information Technology (IT)',
    'Electronics and Telecommunications (EXTC)',
    'Electronics and Computer Engineering (ECE)',
    'Instrumentation Engineering (IE)'
  ];

  // --- RENDERS ---

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

  const isPast = (dateString: string) => {
    if (!dateString) return false;
    if (isToday(dateString)) return false;
    const todayObj = new Date();
    const yyyy = todayObj.getFullYear();
    const mm = String(todayObj.getMonth() + 1).padStart(2, '0');
    const dd = String(todayObj.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    
    const normalizedDate = dateString.trim().toLowerCase();
    if (normalizedDate.includes('today')) return false;
    try {
      const eventTime = new Date(dateString).getTime();
      const todayTime = new Date(todayStr).getTime();
      return eventTime < todayTime;
    } catch (e) {
      return normalizedDate < todayStr;
    }
  };

  const renderJobDetailView = (job: JobOpportunity) => {
    const isTodayDeadline = isToday(job.deadline);
    const isPastDeadline = isPast(job.deadline);
    const appKey = `${job.id}-${student?.id}`;
    const hasApplied = !!applications[appKey];
    const eligibility = getEligibility(student, job);
    
    // For multiple roles
    const currentRole = job.hasMultipleRoles && job.multipleRoles && job.multipleRoles.length > 0 ? job.multipleRoles[activeRoleTab] : null;
    const branchesToDisplay = currentRole ? currentRole.branches : job.branches;
    const ctcToDisplay = currentRole ? currentRole.ctc : job.ctc;
    const stipendToDisplay = currentRole ? currentRole.stipend : job.stipend;
    const respToDisplay = currentRole ? currentRole.responsibilities : job.responsibilities;
    const skillsToDisplay = currentRole ? currentRole.skills : job.skills;

    return (
      <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
        <button
          type="button"
          className="btn-secondary"
          style={{ justifySelf: 'start', padding: '8px 14px', fontSize: '13px' }}
          onClick={() => {
            setSelectedAdminJob(null);
            setActiveRoleTab(0);
          }}
        >
          ← Back to Job Openings Grid
        </button>

        <article className="card" style={{ display: 'grid', gap: '24px', padding: 'var(--space-lg)' }}>
          {/* Header Banner */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span className="opportunity-company" style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-primary)' }}>{job.company}</span>
                <span className="badge badge-alumni" style={{ fontSize: '11px', background: 'var(--color-slate-100)', color: 'var(--color-slate-700)' }}>Batch {job.batch || '2026'}</span>
                {isTodayDeadline && <span className="badge badge-today-pulse" style={{ fontSize: '10px' }}>CLOSES TODAY</span>}
                {isPastDeadline && <span className="badge" style={{ fontSize: '10px', background: 'var(--color-slate-200)', color: 'var(--color-slate-600)' }}>CLOSED</span>}
              </div>
              <h1 style={{ fontSize: '24px', margin: '6px 0 4px 0', color: 'var(--color-slate-900)' }}>
                {job.hasMultipleRoles ? `Multiple Roles (${job.multipleRoles.length})` : job.role}
              </h1>
              <p className="text-secondary" style={{ margin: 0, display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '13px' }}>
                <span>📍 {job.location}</span>
                {job.companyLink && (
                  <span>
                    🔗 <a href={job.companyLink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent)', fontWeight: 600 }}>Visit Website</a>
                  </span>
                )}
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {!isStudent ? (
                <button type="button" className="btn-success" onClick={() => handleExportHR(job)}>
                  Export HR Roster
                </button>
              ) : hasApplied ? (
                <span className="badge badge-applied" style={{ padding: '10px 18px', fontSize: '14px', borderRadius: '8px' }}>
                  Applied ({applications[appKey].round})
                </span>
              ) : (
                <button
                  type="button"
                  className="btn-primary"
                  style={{ background: eligibility.eligible ? 'var(--color-accent)' : 'var(--color-slate-400)' }}
                  disabled={!eligibility.eligible || isPastDeadline}
                  onClick={() => handleApply(job.id)}
                >
                  {isPastDeadline ? 'Registration Closed' : eligibility.eligible ? 'Apply Now' : 'Ineligible to Apply'}
                </button>
              )}
            </div>
          </div>

          {/* Company Intro */}
          {job.companyIntro && (
            <div>
              <h3 style={{ fontSize: '15px', color: 'var(--color-slate-800)', marginBottom: '8px' }}>About the Company</h3>
              <p style={{ margin: 0, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{job.companyIntro}</p>
            </div>
          )}

          {/* Twin Info Grid: Eligibility & Compensation */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            
            {/* Eligibility Scorecard */}
            <div className="card" style={{ border: '1px solid var(--color-border)', padding: '16px', background: 'var(--color-bg-main)' }}>
              <h3 style={{ fontSize: '15px', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                📋 Drive Eligibility Scorecard
              </h3>
              
              <div style={{ display: 'grid', gap: '10px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px' }}>
                  <span className="text-secondary">BE / BTech CGPI Cutoff</span>
                  <strong style={{ color: 'var(--color-slate-900)' }}>{job.minCgpi === 0 ? 'Open' : `${job.minCgpi} CGPI`}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px' }}>
                  <span className="text-secondary">Maximum Live KTs / Backlogs</span>
                  <strong style={{ color: 'var(--color-slate-900)' }}>{job.maxKts} KTs</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px' }}>
                  <span className="text-secondary">10th Marks Criterion</span>
                  <strong style={{ color: 'var(--color-slate-900)' }}>{job.tenthPercent || 'Open'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px' }}>
                  <span className="text-secondary">12th/Diploma Criterion</span>
                  <strong style={{ color: 'var(--color-slate-900)' }}>{job.twelfthPercent || 'Open'}</strong>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span className="text-secondary">Eligible Branches for drive</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                    {branchesToDisplay.map(b => (
                      <span key={b} style={{ fontSize: '11px', background: 'var(--color-slate-200)', color: 'var(--color-slate-700)', padding: '2px 6px', borderRadius: '4px', fontWeight: 500 }}>{b}</span>
                    ))}
                  </div>
                </div>

                {isStudent && (
                  <div style={{ marginTop: '8px', padding: '10px', borderRadius: '6px', background: eligibility.eligible ? 'rgba(13, 148, 136, 0.05)' : 'rgba(239, 68, 68, 0.05)', borderLeft: `4px solid ${eligibility.eligible ? 'var(--color-success)' : 'var(--color-error)'}` }}>
                    <strong style={{ display: 'block', color: eligibility.eligible ? 'var(--color-success)' : 'var(--color-error)' }}>
                      {eligibility.eligible ? '✓ You qualify for this drive!' : '✕ Eligibility criteria not met'}
                    </strong>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{eligibility.reason}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Compensation & Service Agreement */}
            <div className="card" style={{ border: '1px solid var(--color-border)', padding: '16px', background: 'var(--color-bg-main)', display: 'grid', alignContent: 'start', gap: '12px' }}>
              <h3 style={{ fontSize: '15px', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                💰 Compensation & Service Bond
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: '#ffffff', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                  <span className="text-secondary" style={{ fontSize: '11.5px', display: 'block' }}>CTC Package</span>
                  <strong style={{ fontSize: '15px', color: 'var(--color-slate-900)' }}>{ctcToDisplay}</strong>
                </div>
                <div style={{ background: '#ffffff', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                  <span className="text-secondary" style={{ fontSize: '11.5px', display: 'block' }}>Internship Stipend</span>
                  <strong style={{ fontSize: '15px', color: 'var(--color-slate-900)' }}>{stipendToDisplay || 'N/A'}</strong>
                </div>
              </div>

              {job.hasBond ? (
                <div style={{ background: 'rgba(217, 119, 6, 0.05)', padding: '10px 14px', borderRadius: '6px', borderLeft: '4px solid var(--color-warning)', fontSize: '12.5px' }}>
                  <strong style={{ color: 'var(--color-warning)', display: 'block', marginBottom: '2px' }}>⚠️ Service Agreement / Bond Required</strong>
                  Selected candidates must sign a service bond of <strong>{job.bondDuration || '2 years'}</strong> with a breach penalty of <strong>{job.bondPenalty || 'Rs. 2,00,000'}</strong>.
                </div>
              ) : (
                <div style={{ background: 'rgba(13, 148, 136, 0.05)', padding: '10px 14px', borderRadius: '6px', borderLeft: '4px solid var(--color-accent)', fontSize: '12.5px', color: 'var(--color-accent)', fontWeight: 500 }}>
                  ✓ Direct joining. No service bond or penalty agreement.
                </div>
              )}
            </div>

          </div>

          {/* Multiple Roles Tab Selector */}
          {job.hasMultipleRoles && job.multipleRoles && job.multipleRoles.length > 0 && (
            <div style={{ display: 'grid', gap: '10px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
              <span className="service-eyebrow" style={{ color: 'var(--color-accent)' }}>Multi-role Recruitment Profiles</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {job.multipleRoles.map((roleOpt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="btn-secondary"
                    style={{
                      background: activeRoleTab === idx ? 'var(--color-accent)' : 'none',
                      color: activeRoleTab === idx ? '#ffffff' : 'var(--color-slate-600)',
                      borderColor: activeRoleTab === idx ? 'var(--color-accent)' : 'var(--color-border)',
                      padding: '6px 12px',
                      fontSize: '12.5px',
                      borderRadius: '20px'
                    }}
                    onClick={() => setActiveRoleTab(idx)}
                  >
                    {roleOpt.title} ({roleOpt.ctc})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Role Details */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
            <div>
              <h3 style={{ fontSize: '15px', color: 'var(--color-slate-800)', marginBottom: '8px' }}>
                🎯 Role Responsibilities {currentRole && `(${currentRole.title})`}
              </h3>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '13.5px', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {respToDisplay || 'No detailed responsibilities specified. Refer to the attached JD.'}
              </div>
            </div>
            <div>
              <h3 style={{ fontSize: '15px', color: 'var(--color-slate-800)', marginBottom: '8px' }}>
                ⚡ Required Core Skills
              </h3>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '13.5px', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {skillsToDisplay || 'Standard engineering domain skills required.'}
              </div>
            </div>
          </div>

          {/* Selection Rounds & Process */}
          {job.selectionProcess && (
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
              <h3 style={{ fontSize: '15px', color: 'var(--color-slate-800)', marginBottom: '8px' }}>Selection rounds & Interview Process</h3>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '13.5px', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {job.selectionProcess}
              </div>
            </div>
          )}

          {/* Important Links & Dates */}
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '24px', background: 'rgba(15, 23, 42, 0.02)', padding: '16px', borderRadius: '8px' }}>
            <div style={{ minWidth: '150px' }}>
              <span className="text-secondary" style={{ fontSize: '11px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Registration Deadline</span>
              <strong style={{ color: isPastDeadline ? 'var(--color-error)' : 'var(--color-slate-900)' }}>
                {new Date(job.deadline).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                {isPastDeadline ? ' (Expired)' : ` (${isTodayDeadline ? 'Today' : 'Upcoming'})`}
              </strong>
            </div>

            {job.registrationLink && (
              <div style={{ minWidth: '150px' }}>
                <span className="text-secondary" style={{ fontSize: '11px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Apply Link (External)</span>
                <a href={job.registrationLink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 'bold', fontSize: '13px' }}>
                  eLitmus / Corporate Link ↗
                </a>
              </div>
            )}

            {/* Confirmation link removed. Student apply action is the confirmation. */}
          </div>
        </article>

        {/* Funnel Table integrated below the detail summary card for Admin view */}
        {!isStudent && (
          <article className="card" style={{ display: 'grid', gap: '14px', marginTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '18px', margin: 0 }}>Funnel Candidate Progression</h2>
                <p className="text-secondary" style={{ margin: 0, fontSize: '13px' }}>Promote qualifying candidates across interview slots or review their resumes.</p>
              </div>
            </div>

            <div className="student-directory-table-wrapper" style={{ marginTop: '10px' }}>
              <table className="student-directory-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>College CGPI / KTs</th>
                    <th>Current Funnel Round</th>
                    <th>Selection Status</th>
                    <th>Uploaded Resume</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(applications)
                    .filter(key => key.startsWith(`${job.id}-`))
                    .map(key => {
                      const app = applications[key];
                      const studentDetail = studentsList.find(s => s.id === app.studentId);
                      const resume = getResumeForStudent(app.studentId);

                      return (
                        <tr key={key}>
                          <td>
                            <strong>{app.studentName}</strong>
                            <span className="table-subtext">{studentDetail?.branch || 'Branch loading...'}</span>
                          </td>
                          <td>
                            <span>{studentDetail?.academic_history?.se_cgpi || '8.2'} CGPI</span>
                            <span className="table-subtext">{studentDetail?.academic_history?.live_kt ?? 0} backlogs</span>
                          </td>
                          <td>
                            <select
                              value={app.round}
                              style={{ padding: '6px', fontSize: '12.5px', borderRadius: '4px' }}
                              onChange={(e) => handleUpdateApplicantStatus(job.id, app.studentId, 'round', e.target.value)}
                            >
                              <option value="Aptitude Test">Aptitude Test</option>
                              <option value="Group Discussion">Group Discussion</option>
                              <option value="Technical Round">Technical Interview</option>
                              <option value="HR Interview">HR Interview</option>
                              <option value="Offer Extended">Offer Extended</option>
                            </select>
                          </td>
                          <td>
                            <select
                              value={app.status}
                              style={{ padding: '6px', fontSize: '12.5px', borderRadius: '4px' }}
                              onChange={(e) => handleUpdateApplicantStatus(job.id, app.studentId, 'status', e.target.value)}
                            >
                              <option value="Active">Active</option>
                              <option value="Qualified">Qualified</option>
                              <option value="Rejected">Rejected</option>
                            </select>
                          </td>
                          <td>
                            {resume ? (
                              <span style={{ fontSize: '12.5px', color: 'var(--color-primary)', fontWeight: 'bold' }}>
                                {resume.filename}
                              </span>
                            ) : (
                              <span style={{ fontSize: '12px', color: 'var(--color-slate-400)' }}>Pending Upload</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  {Object.keys(applications).filter(key => key.startsWith(`${job.id}-`)).length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '18px' }}>
                        There are currently no registered student applications for this drive.
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

  // 1. OPPORTUNITIES VIEW
  const renderOpportunitiesTab = () => {
    if (isStudent) {
      if (selectedAdminJob) {
        return renderJobDetailView(selectedAdminJob);
      }

      return (
        <div style={{ display: 'grid', gap: 'var(--space-md)', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          {jobs.map((job) => {
            const appKey = `${job.id}-${student?.id}`;
            const hasApplied = !!applications[appKey];
            const eligibility = getEligibility(student, job);
            const isEligible = eligibility.eligible;
            const deadlinePast = isPast(job.deadline);

            return (
              <article className={`opportunity-card ${deadlinePast ? 'is-past-event' : ''}`} key={job.id}>
                <div className="opportunity-header">
                  <div>
                    <span className="opportunity-company" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {job.company}
                      {isToday(job.deadline) && (
                        <span className="badge badge-today-pulse" style={{ fontSize: '8px', padding: '2px 5px' }}>TODAY</span>
                      )}
                    </span>
                    <h2 className="opportunity-title">{job.hasMultipleRoles ? `Multiple Roles (${job.multipleRoles?.length || 2})` : job.role}</h2>
                  </div>
                  <span className={`badge ${hasApplied ? 'badge-applied' : isEligible ? 'badge-eligible' : 'badge-not-eligible'}`}>
                    {hasApplied ? 'Applied' : isEligible ? 'Eligible' : 'Ineligible'}
                  </span>
                </div>

                <div className="opportunity-details">
                  <span>CTC: {job.ctc}</span>
                  <span>Location: {job.location}</span>
                  <span>Min: {job.minCgpi} CGPI</span>
                  <span>Max: {job.maxKts} KT</span>
                </div>

                <div className={`opportunity-eligibility ${isEligible ? 'eligible' : 'ineligible'}`}>
                  {isEligible ? 'Eligible: You meet all eligibility criteria' : `Ineligible: ${eligibility.reason}`}
                </div>

                <div className="opportunity-actions" style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => {
                      setSelectedAdminJob(job);
                      setActiveRoleTab(0);
                    }}
                  >
                    View Details
                  </button>
                  {hasApplied ? (
                    <button type="button" className="btn-secondary" style={{ flex: 1 }} disabled>
                      Applied ({applications[appKey].round})
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ flex: 1 }}
                      disabled={!isEligible || studentMeQuery.isLoading || deadlinePast}
                      onClick={() => handleApply(job.id)}
                    >
                      {deadlinePast ? 'Closed' : 'Apply Now'}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      );
    }

    // TPO/Volunteer View
    return (
      <div style={{ display: 'grid', gap: 'var(--space-lg)' }}>
        <section className="page-header" style={{ margin: 0, padding: 0 }}>
          <div>
            <h2 style={{ fontSize: '18px' }}>Placement Funnel & Qualifications</h2>
            <p className="text-secondary" style={{ fontSize: '13px', margin: 0 }}>Monitor qualifying funnel phases, select a job card to manage candidates, and export complete rosters to HR.</p>
          </div>
          {canManageOpenings && (
            <button 
              type="button" 
              className="btn-primary" 
              onClick={() => navigate('/placements/opportunities/create')}
            >
              Create Job Opening
            </button>
          )}
        </section>

        {selectedAdminJob ? (
          renderJobDetailView(selectedAdminJob)
        ) : (
          <div style={{ display: 'grid', gap: 'var(--space-md)', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}>
            {jobs.map(job => {
              const applicantCount = Object.keys(applications).filter(key => key.startsWith(`${job.id}-`)).length;
              const deadlinePast = isPast(job.deadline);
              return (
                <article className={`opportunity-card animate-scaleUp ${deadlinePast ? 'is-past-event' : ''}`} key={job.id}>
                  <div className="opportunity-header">
                    <div>
                      <span className="opportunity-company" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {job.company}
                        {isToday(job.deadline) && (
                          <span className="badge badge-today-pulse" style={{ fontSize: '8px', padding: '2px 5px' }}>TODAY</span>
                        )}
                      </span>
                      <h2 className="opportunity-title" style={{ fontSize: '16px', margin: '4px 0' }}>{job.hasMultipleRoles ? `Multiple Roles (${job.multipleRoles?.length || 2})` : job.role}</h2>
                    </div>
                    <span className="badge badge-applied">{applicantCount} Applied</span>
                  </div>

                  <div className="opportunity-details">
                    <span>CTC: {job.ctc}</span>
                    <span>Location: {job.location}</span>
                    <span>Min: {job.minCgpi} CGPI</span>
                    <span>Max: {job.maxKts} KT</span>
                  </div>

                  <div className="opportunity-eligibility" style={{ fontSize: '12.5px', borderLeftColor: 'var(--color-primary)' }}>
                    <strong>Target: </strong> {job.branches.join(', ')}
                  </div>

                  <div className="opportunity-actions" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '6px' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ justifyContent: 'center' }}
                      onClick={() => handleExportHR(job)}
                    >
                      Export HR
                    </button>
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ justifyContent: 'center' }}
                      onClick={() => {
                        setSelectedAdminJob(job);
                        setActiveRoleTab(0);
                      }}
                    >
                      View Details
                    </button>
                  </div>
                </article>
              );
            })}
            {jobs.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '36px', color: 'var(--color-slate-400)', fontStyle: 'italic' }}>
                No job opportunities listed.
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // 2. PLACEMENT DAILY ATTENDANCE DRIVE VIEW
  const renderAttendanceTab = () => {
    if (isStudent) {
      // Find all drives student is imported in
      const myDrives = drives.filter(d => d.attendance[student?.id || 0] !== undefined);

      return (
        <article className="card">
          <h3>My Placement Drive Attendance Turnout</h3>
          <p className="text-secondary" style={{ marginBottom: '16px' }}>View scheduled daily placement rounds attendance and verification states.</p>
          
          <div className="student-directory-table-wrapper">
            <table className="student-directory-table">
              <thead>
                <tr>
                  <th>Placement Event Drive</th>
                  <th>Company Opportunity</th>
                  <th>Round Date</th>
                  <th>Attendance Verification</th>
                </tr>
              </thead>
              <tbody>
                {myDrives.map(d => {
                  const status = d.attendance[student?.id || 0];
                  const todayGlow = isToday(d.date);
                  return (
                    <tr key={d.id}>
                      <td>
                        <strong>{d.name}</strong>
                        {todayGlow && (
                          <span className="badge badge-today-pulse" style={{ marginLeft: '8px', fontSize: '9px', padding: '2px 6px' }}>TODAY</span>
                        )}
                      </td>
                      <td>{d.opportunityName}</td>
                      <td>{d.date}</td>
                      <td>
                        <span className={`badge ${status === 'Present' ? 'badge-active' : status === 'Late' ? 'badge-extended' : 'badge-not-eligible'}`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {myDrives.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: 'var(--color-slate-400)' }}>
                      No placement drive attendance logs found. (You will appear here when you apply to opportunities and drives are scheduled).
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      );
    }

    // TPO/Volunteer View
    return (
      <div style={{ display: 'grid', gap: 'var(--space-lg)' }}>
        <section className="page-header" style={{ margin: 0, padding: 0 }}>
          <div>
            <h2 style={{ fontSize: '18px' }}>Placement Drive Attendance Sheets</h2>
            <p className="text-secondary" style={{ fontSize: '13px', margin: 0 }}>Coordinate daily physical round checklists. Click a drive card to verify imported candidates.</p>
          </div>
          {canManageOpenings && (
            <button 
              type="button" 
              className="btn-primary" 
              onClick={() => navigate('/placements/drives/create')}
            >
              Create Placement Drive
            </button>
          )}
        </section>

        {selectedDrive ? (
          <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
            <button
              type="button"
              className="btn-secondary"
              style={{ justifySelf: 'start', padding: '8px 14px', fontSize: '13px' }}
              onClick={() => setSelectedDrive(null)}
            >
              ← Back to Drives Grid
            </button>
            <article className="card" style={{ display: 'grid', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <span className="service-eyebrow">Attendance Sheet</span>
                  <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {selectedDrive.name}
                    {isToday(selectedDrive.date) && (
                      <span className="badge badge-today-pulse" style={{ fontSize: '10px', padding: '3px 8px' }}>TODAY</span>
                    )}
                  </h2>
                  <p className="text-secondary" style={{ margin: 0, fontSize: '13px' }}>
                    Company: {selectedDrive.opportunityName} | Date: {selectedDrive.date} | Total Imported Candidates: {Object.keys(selectedDrive.attendance).length}
                  </p>
                </div>
                
                <button 
                  type="button" 
                  className="btn-primary" 
                  style={{ padding: '8px 14px', fontSize: '13px' }}
                  onClick={() => navigate(`/placements/drives/mark-single/${selectedDrive.id}`)}
                >
                  Launch Fast Attendance Marker
                </button>
              </div>

              <div className="student-directory-table-wrapper" style={{ marginTop: '10px' }}>
                <table className="student-directory-table">
                  <thead>
                    <tr>
                      <th>Imported Candidate Name</th>
                      <th>College Roll Number</th>
                      <th>Major Branch</th>
                      <th>Drive Turnout Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(selectedDrive.attendance).map(studentIdStr => {
                      const targetId = Number(studentIdStr);
                      const status = selectedDrive.attendance[targetId];
                      const studentDetail = studentsList.find(s => s.id === targetId);

                      return (
                        <tr key={targetId}>
                          <td><strong>{studentDetail?.full_name || 'Loading Student...'}</strong></td>
                          <td><code>{studentDetail?.college_roll_no || 'N/A'}</code></td>
                          <td>{studentDetail?.branch || 'N/A'}</td>
                          <td>
                            <select
                              value={status}
                              style={{ padding: '6px', fontSize: '13px', borderRadius: '4px' }}
                              onChange={(e) => handleMarkDriveAttendance(selectedDrive.id, targetId, e.target.value as any)}
                            >
                              <option value="Present">Present</option>
                              <option value="Absent">Absent</option>
                              <option value="Late">Late</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                    {Object.keys(selectedDrive.attendance).length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: 'var(--color-slate-400)' }}>
                          No candidates imported. (This happens when no student has applied to the opportunity prior to scheduling the drive).
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </article>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 'var(--space-md)', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
            {drives.map(d => {
              const candidatesCount = Object.keys(d.attendance).length;
              const todayGlow = isToday(d.date);
              const pastGlow = isPast(d.date);
              return (
                <article className={`opportunity-card animate-scaleUp ${pastGlow ? 'is-past-event' : ''}`} key={d.id}>
                  <div className="opportunity-header">
                    <div>
                      <span className="opportunity-company" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {d.opportunityName}
                        {todayGlow && (
                          <span className="badge badge-today-pulse" style={{ fontSize: '9px', padding: '2px 6px' }}>TODAY</span>
                        )}
                      </span>
                      <h2 className="opportunity-title" style={{ fontSize: '16px', margin: '4px 0' }}>{d.name}</h2>
                    </div>
                    <span className="badge badge-applied">{candidatesCount} Imported</span>
                  </div>

                  <div className="opportunity-details" style={{ borderBottom: 'none' }}>
                    <span>Date scheduled: {d.date}</span>
                  </div>

                  <div className="opportunity-actions" style={{ marginTop: '8px' }}>
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={() => setSelectedDrive(d)}
                      disabled={pastGlow}
                    >
                      {pastGlow ? 'Drive Expired' : 'Coordinate Turnout Checklist'}
                    </button>
                  </div>
                </article>
              );
            })}
            {drives.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '36px', color: 'var(--color-slate-400)', fontStyle: 'italic' }}>
                No active daily placement drives scheduled.
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
      {/* Upper Title */}
      <section className="page-header" style={{ marginBottom: 'var(--space-sm)' }}>
        <div>
          <h1>Placement Operations</h1>
          <p className="text-secondary">Explore corporate opportunities and log drive-specific student rosters attendance.</p>
        </div>
      </section>

      {/* Premium Visual Tab Deck Container */}
      <section className="premium-tab-deck">
        <button
          type="button"
          className={`premium-tab-btn ${activeTab === 'opportunities' ? 'is-active' : ''}`}
          onClick={() => {
            setActiveTab('opportunities');
            setSelectedAdminJob(null);
          }}
        >
          <span className="premium-tab-title">Job Opportunities</span>
          <span className="premium-tab-subtitle">Manage open positions, cutoffs, qualifications, and HR rosters</span>
        </button>
        <button
          type="button"
          className={`premium-tab-btn ${activeTab === 'attendance' ? 'is-active' : ''}`}
          onClick={() => {
            setActiveTab('attendance');
            setSelectedDrive(null);
          }}
        >
          <span className="premium-tab-title">Placement Drive Attendance</span>
          <span className="premium-tab-subtitle">Track physical daily turnout checklists for active corporate rounds</span>
        </button>
      </section>

      {/* Dynamic Tab Body */}
      {activeTab === 'opportunities' ? renderOpportunitiesTab() : renderAttendanceTab()}
    </div>
  );
};

export default PlacementsPage;

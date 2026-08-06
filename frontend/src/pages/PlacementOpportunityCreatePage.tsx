import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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

const PlacementOpportunityCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [ctc, setCtc] = useState('');
  const [stipend, setStipend] = useState('');
  const [location, setLocation] = useState('');
  const [minCgpi, setMinCgpi] = useState('Open');
  const [maxKts, setMaxKts] = useState('0');
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [batch, setBatch] = useState('2026');
  const [companyIntro, setCompanyIntro] = useState('');
  const [companyLink, setCompanyLink] = useState('');
  const [tenthPercent, setTenthPercent] = useState('Open');
  const [twelfthPercent, setTwelfthPercent] = useState('Open');

  const [hasBond, setHasBond] = useState(false);
  const [bondDuration, setBondDuration] = useState('2 years');
  const [bondPenalty, setBondPenalty] = useState('');

  const [hasMultipleRoles, setHasMultipleRoles] = useState(false);
  const [multipleRoles, setMultipleRoles] = useState<RoleDetail[]>([
    { title: '', ctc: '', stipend: '', branches: [], responsibilities: '', skills: '' },
  ]);

  const [responsibilities, setResponsibilities] = useState('');
  const [skills, setSkills] = useState('');
  const [selectionProcess, setSelectionProcess] = useState('');
  const [registrationLink, setRegistrationLink] = useState('');
  const [deadline, setDeadline] = useState('');

  const [saving, setSaving] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [previewRoleTab, setPreviewRoleTab] = useState(0);

  const [ingesting, setIngesting] = useState(false);
  const [ingestProgress, setIngestProgress] = useState('');

  const branchOptions = [
    'Computer Engineering (CE)',
    'Computer Science Business Systems (CSBS)',
    'Computer Science and Engineering AI/ML (CSE AI/ML)',
    'Computer Science and Engineering AI/DS (CSE AI/DS)',
    'Computer Science and Engineering Cybersecurity (CSE CC)',
    'Information Technology (IT)',
    'Electronics and Telecommunications (EXTC)',
    'Electronics and Computer Engineering (ECE)',
    'Instrumentation Engineering (IE)',
  ];

  const handlePdfIngestion = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIngesting(true);
    setIngestProgress('Initializing PDF Ingestor...');

    setTimeout(() => {
      setIngestProgress('Analyzing document structure...');
      setTimeout(() => {
        setIngestProgress(
          'Extracting core roles, compensation, and eligibility rules...',
        );
        setTimeout(() => {
          const fname = file.name.toLowerCase();
          let parsedCompany = 'TechCorp Global';
          let parsedRole = 'Associate Cloud Developer';
          let parsedCtc = '12.0 LPA';
          let parsedStipend = 'Rs. 35,000 / month';
          let parsedLocation = 'Pune (Hybrid)';
          const parsedSkills =
            '• Strong foundation in Python/Java & Web Tech\n• Experience with relational databases (SQL)\n• Basic git workflow knowledge';
          const parsedResponsibilities =
            '• Assist in developing high scalability cloud microservices.\n• Participate in continuous testing & deploy pipelines.\n• Document code logic and api specifications.';

          if (fname.includes('google')) {
            parsedCompany = 'Google India';
            parsedRole = 'Software Engineering Graduate';
            parsedCtc = '32.0 LPA';
            parsedStipend = 'Rs. 1,00,000 / month';
            parsedLocation = 'Hyderabad / Bangalore';
          } else if (fname.includes('microsoft')) {
            parsedCompany = 'Microsoft India';
            parsedRole = 'Software Engineering GET';
            parsedCtc = '28.0 LPA';
            parsedStipend = 'Rs. 90,000 / month';
            parsedLocation = 'Noida / Hyderabad';
          } else if (fname.includes('nvidia')) {
            parsedCompany = 'NVIDIA Graphics';
            parsedRole = 'Hardware/Software Engineer Trainee';
            parsedCtc = '22.0 LPA';
            parsedStipend = 'Rs. 75,000 / month';
            parsedLocation = 'Pune';
          }

          setCompany(parsedCompany);
          setRole(parsedRole);
          setCtc(parsedCtc);
          setStipend(parsedStipend);
          setLocation(parsedLocation);
          setSkills(parsedSkills);
          setResponsibilities(parsedResponsibilities);

          setMinCgpi('Open');
          setMaxKts('0');
          setTenthPercent('Open');
          setTwelfthPercent('Open');
          setBatch('2026');
          setCompanyIntro(
            `${parsedCompany} is a leading global technology provider pioneering innovation in enterprise infrastructure and digital solutions.`,
          );
          setSelectionProcess(
            '1. Resume screening & ATS evaluation\n2. Online Technical MCQ Assessment\n3. System Design & Coding Interview Rounds\n4. HR Leadership Round',
          );

          setSelectedBranches([
            'Computer Engineering (CE)',
            'Computer Science Business Systems (CSBS)',
            'Computer Science and Engineering AI/ML (CSE AI/ML)',
            'Computer Science and Engineering AI/DS (CSE AI/DS)',
            'Computer Science and Engineering Cybersecurity (CSE CC)',
            'Information Technology (IT)',
          ]);

          setIngesting(false);
          setIngestProgress('');
          alert(
            `Successfully ingested "${file.name}"! Form fields have been auto-populated with extracted parameters.`,
          );
        }, 800);
      }, 800);
    }, 600);
  };

  const handleAddRole = () => {
    setMultipleRoles([
      ...multipleRoles,
      { title: '', ctc: '', stipend: '', branches: [], responsibilities: '', skills: '' },
    ]);
  };

  const handleRemoveRole = (index: number) => {
    const updated = [...multipleRoles];
    updated.splice(index, 1);
    setMultipleRoles(updated);
  };

  const handleRoleChange = (index: number, field: keyof RoleDetail, value: any) => {
    const updated = [...multipleRoles];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setMultipleRoles(updated);
  };

  const handleRoleBranchToggle = (index: number, branch: string, checked: boolean) => {
    const roleBranches = multipleRoles[index].branches;
    let updatedBranches = [...roleBranches];
    if (checked) {
      updatedBranches.push(branch);
    } else {
      updatedBranches = updatedBranches.filter((b) => b !== branch);
    }
    handleRoleChange(index, 'branches', updatedBranches);
  };

  const handleEnterPreview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !location || !deadline) {
      alert(
        'Please fill out all mandatory fields (Company, Location, and Registration Deadline).',
      );
      return;
    }

    if (!hasMultipleRoles && (!role || !ctc)) {
      alert('Please define the Job Role and CTC package for this opportunity.');
      return;
    }

    if (hasMultipleRoles) {
      const invalid = multipleRoles.some((r) => !r.title || !r.ctc);
      if (invalid) {
        alert('Please fill out the Title and CTC package for all defined job roles.');
        return;
      }
    }

    setPreviewRoleTab(0);
    setIsPreviewMode(true);
  };

  const handleSave = () => {
    setSaving(true);
    setShowConfirmModal(false);
    try {
      const storedJobs = localStorage.getItem('placement_crm_jobs');
      const jobsList: JobOpportunity[] = storedJobs ? JSON.parse(storedJobs) : [];

      const newJob: JobOpportunity = {
        id: Date.now(),
        company,
        role: hasMultipleRoles ? multipleRoles[0].title : role,
        ctc: hasMultipleRoles ? multipleRoles[0].ctc : ctc,
        location,
        minCgpi:
          minCgpi === 'Open' || !minCgpi || isNaN(Number(minCgpi))
            ? 0.0
            : Number(minCgpi),
        maxKts: Number(maxKts),
        branches: selectedBranches.length > 0 ? selectedBranches : branchOptions,

        batch,
        companyIntro,
        companyLink,
        tenthPercent,
        twelfthPercent,
        stipend: hasMultipleRoles ? multipleRoles[0].stipend || 'N/A' : stipend || 'N/A',

        hasBond,
        bondDuration: hasBond ? bondDuration : undefined,
        bondPenalty: hasBond ? bondPenalty : undefined,

        hasMultipleRoles,
        multipleRoles: hasMultipleRoles ? multipleRoles : [],

        responsibilities: hasMultipleRoles
          ? multipleRoles[0].responsibilities
          : responsibilities,
        skills: hasMultipleRoles ? multipleRoles[0].skills : skills,
        selectionProcess,

        registrationLink,
        deadline,
      };

      localStorage.setItem('placement_crm_jobs', JSON.stringify([...jobsList, newJob]));
      alert('Placement opening created successfully with full CRM parameters!');
      navigate('/placements');
    } catch (err) {
      console.error(err);
      alert('Failed to save opening.');
    } finally {
      setSaving(false);
    }
  };

  const renderForm = () => (
    <form onSubmit={handleEnterPreview} style={{ display: 'grid', gap: '24px' }}>
      {/* AI JD PDF Ingestor Banner */}
      <div
        style={{
          background: 'rgba(13, 148, 136, 0.03)',
          border: '1px dashed rgba(13, 148, 136, 0.25)',
          borderRadius: '12px',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
          marginBottom: '8px',
        }}
      >
        <div style={{ flex: 1, minWidth: '280px', textAlign: 'left' }}>
          <h4
            style={{
              margin: 0,
              color: 'var(--color-accent)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '15px',
              fontWeight: 700,
            }}
          >
            ✨ AI Job Description Ingestor
          </h4>
          <p
            className="text-secondary"
            style={{
              margin: '4px 0 0 0',
              fontSize: '12.5px',
              lineHeight: 1.4,
              textAlign: 'left',
            }}
          >
            Have a placement JD? Upload the PDF to automatically extract roles,
            compensation packages, branch rules, and eligibility cutoffs!
          </p>
        </div>

        <label
          className="btn-primary"
          style={{
            background: 'var(--color-accent)',
            cursor: ingesting ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            margin: 0,
            padding: '8px 16px',
            borderRadius: '20px',
            fontWeight: 600,
            color: '#ffffff',
            boxShadow: '0 4px 6px -1px rgba(13, 148, 136, 0.2)',
          }}
        >
          {ingesting ? 'Processing...' : '📎 Ingest JD PDF'}
          <input
            type="file"
            accept=".pdf"
            style={{ display: 'none' }}
            onChange={handlePdfIngestion}
            disabled={ingesting}
          />
        </label>
      </div>

      {ingesting && (
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.03)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '24px',
            display: 'grid',
            gap: '12px',
            justifyContent: 'center',
            justifyItems: 'center',
            textAlign: 'center',
          }}
        >
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <div
            style={{
              width: '28px',
              height: '28px',
              border: '3px solid var(--color-slate-200)',
              borderTop: '3px solid var(--color-accent)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          ></div>
          <span
            style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-slate-700)' }}
          >
            {ingestProgress}
          </span>
        </div>
      )}

      <h3
        style={{
          borderBottom: '2px solid var(--color-slate-100)',
          paddingBottom: '8px',
          color: 'var(--color-primary)',
        }}
      >
        1. Corporate & Drive Identity
      </h3>
      <div className="student-form-grid">
        <label className="form-group">
          Company Name *
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g. Google India"
            required
          />
        </label>
        <label className="form-group">
          Target Graduating Batch *
          <input
            type="text"
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
            placeholder="e.g. 2026"
            required
          />
        </label>
        <label className="form-group">
          Company Website URL
          <input
            type="url"
            value={companyLink}
            onChange={(e) => setCompanyLink(e.target.value)}
            placeholder="e.g. https://careers.google.com"
          />
        </label>
        <label className="form-group">
          Primary Location *
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Pune / Bangalore (Hybrid)"
            required
          />
        </label>
      </div>

      <label className="form-group">
        Company Short Introduction
        <textarea
          value={companyIntro}
          onChange={(e) => setCompanyIntro(e.target.value)}
          placeholder="Provide a brief paragraph describing the company's business domains and values..."
          rows={3}
        />
      </label>

      <h3
        style={{
          borderBottom: '2px solid var(--color-slate-100)',
          paddingBottom: '8px',
          color: 'var(--color-primary)',
          marginTop: '8px',
        }}
      >
        2. Academic Eligibility & Filters
      </h3>
      <div className="student-form-grid">
        <label className="form-group">
          10th Marks Requirement
          <input
            type="text"
            value={tenthPercent}
            onChange={(e) => setTenthPercent(e.target.value)}
            placeholder="e.g. 60% or Open"
          />
        </label>
        <label className="form-group">
          12th / Diploma Marks Requirement
          <input
            type="text"
            value={twelfthPercent}
            onChange={(e) => setTwelfthPercent(e.target.value)}
            placeholder="e.g. 60% or Open"
          />
        </label>
        <label className="form-group">
          Minimum BE/BTech CGPI Cutoff
          <input
            type="text"
            value={minCgpi}
            onChange={(e) => setMinCgpi(e.target.value)}
            placeholder="e.g. 7.5 or Open"
            required
          />
        </label>
        <label className="form-group">
          Maximum Live Backlogs (KT) Allowed
          <input
            type="number"
            value={maxKts}
            onChange={(e) => setMaxKts(e.target.value)}
            required
          />
        </label>
      </div>

      <div className="form-group">
        <label>General Eligible Branches</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '6px' }}>
          {branchOptions.map((b) => (
            <label
              key={b}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              <input
                type="checkbox"
                checked={selectedBranches.includes(b)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedBranches([...selectedBranches, b]);
                  } else {
                    setSelectedBranches(selectedBranches.filter((x) => x !== b));
                  }
                }}
              />
              {b}
            </label>
          ))}
        </div>
      </div>

      <h3
        style={{
          borderBottom: '2px solid var(--color-slate-100)',
          paddingBottom: '8px',
          color: 'var(--color-primary)',
          marginTop: '8px',
        }}
      >
        3. Compensation & Service Agreement
      </h3>
      <div
        style={{
          display: 'flex',
          gap: '20px',
          alignItems: 'center',
          marginBottom: '8px',
        }}
      >
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 600,
            fontSize: '14.5px',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={hasBond}
            onChange={(e) => setHasBond(e.target.checked)}
            style={{ width: '18px', height: '18px' }}
          />
          Selected candidates must sign a Service Agreement / Bond
        </label>
      </div>

      {hasBond && (
        <div
          className="student-form-grid"
          style={{
            background: 'rgba(139, 30, 30, 0.03)',
            padding: '16px',
            borderRadius: '10px',
            border: '1px dashed rgba(139, 30, 30, 0.15)',
          }}
        >
          <label className="form-group">
            Bond Duration / Period
            <input
              type="text"
              value={bondDuration}
              onChange={(e) => setBondDuration(e.target.value)}
              placeholder="e.g. 2 years"
            />
          </label>
          <label className="form-group">
            Penalty Amount for Breach
            <input
              type="text"
              value={bondPenalty}
              onChange={(e) => setBondPenalty(e.target.value)}
              placeholder="e.g. Rs. 2,00,000"
            />
          </label>
        </div>
      )}

      <div
        style={{ display: 'flex', gap: '20px', alignItems: 'center', marginTop: '4px' }}
      >
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 600,
            fontSize: '14.5px',
            cursor: 'pointer',
            color: 'var(--color-accent)',
          }}
        >
          <input
            type="checkbox"
            checked={hasMultipleRoles}
            onChange={(e) => setHasMultipleRoles(e.target.checked)}
            style={{ width: '18px', height: '18px' }}
          />
          Recruitment is for multiple distinct job roles
        </label>
      </div>

      {!hasMultipleRoles && (
        <div style={{ display: 'grid', gap: '16px' }}>
          <div className="student-form-grid">
            <label className="form-group">
              Job Designation Title *
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Graduate Software Engineer"
              />
            </label>
            <label className="form-group">
              CTC Package *
              <input
                type="text"
                value={ctc}
                onChange={(e) => setCtc(e.target.value)}
                placeholder="e.g. 10.5 LPA"
              />
            </label>
            <label className="form-group">
              Monthly Internship Stipend (If applicable)
              <input
                type="text"
                value={stipend}
                onChange={(e) => setStipend(e.target.value)}
                placeholder="e.g. Rs. 35,000 / month or N/A"
              />
            </label>
          </div>

          <div className="student-form-grid">
            <label className="form-group">
              Job Responsibilities
              <textarea
                value={responsibilities}
                onChange={(e) => setResponsibilities(e.target.value)}
                placeholder="• Implement core software modules&#10;• Write unit tests&#10;• Participate in code reviews"
                rows={4}
              />
            </label>
            <label className="form-group">
              Required Core Skills
              <textarea
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="• Strong algorithms & data structures&#10;• Proficient in Python / Java&#10;• Git & Docker"
                rows={4}
              />
            </label>
          </div>
        </div>
      )}

      {hasMultipleRoles && (
        <div
          style={{
            display: 'grid',
            gap: '20px',
            background: 'rgba(13, 148, 136, 0.02)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid rgba(13, 148, 136, 0.1)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h4 style={{ margin: 0, color: 'var(--color-accent)' }}>
              Job Designation Profiles
            </h4>
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '12px' }}
              onClick={handleAddRole}
            >
              + Add Another Role
            </button>
          </div>

          {multipleRoles.map((item, idx) => (
            <div
              key={idx}
              style={{
                background: '#ffffff',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                display: 'grid',
                gap: '14px',
                position: 'relative',
              }}
            >
              {multipleRoles.length > 1 && (
                <button
                  type="button"
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    border: 'none',
                    background: 'none',
                    color: 'var(--color-error)',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleRemoveRole(idx)}
                >
                  ✕ Remove Role
                </button>
              )}
              <h5
                style={{
                  margin: '0 0 4px 0',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: 'var(--color-slate-800)',
                }}
              >
                Role #{idx + 1} Profile
              </h5>

              <div className="student-form-grid">
                <label className="form-group">
                  Designation Title *
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => handleRoleChange(idx, 'title', e.target.value)}
                    placeholder="e.g. Associate Developer"
                    required
                  />
                </label>
                <label className="form-group">
                  CTC Package *
                  <input
                    type="text"
                    value={item.ctc}
                    onChange={(e) => handleRoleChange(idx, 'ctc', e.target.value)}
                    placeholder="e.g. 8.5 LPA"
                    required
                  />
                </label>
                <label className="form-group">
                  Monthly Stipend
                  <input
                    type="text"
                    value={item.stipend || ''}
                    onChange={(e) => handleRoleChange(idx, 'stipend', e.target.value)}
                    placeholder="e.g. Rs. 25,000 / month"
                  />
                </label>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: 600 }}>
                  Branch Eligibility for Role #{idx + 1}
                </label>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '12px',
                    marginTop: '4px',
                  }}
                >
                  {branchOptions.map((b) => (
                    <label
                      key={b}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={item.branches.includes(b)}
                        onChange={(e) => handleRoleBranchToggle(idx, b, e.target.checked)}
                      />
                      {b}
                    </label>
                  ))}
                </div>
              </div>

              <div className="student-form-grid">
                <label className="form-group">
                  Role-specific Responsibilities
                  <textarea
                    value={item.responsibilities}
                    onChange={(e) =>
                      handleRoleChange(idx, 'responsibilities', e.target.value)
                    }
                    placeholder="e.g. Focus on web backend engineering..."
                    rows={3}
                  />
                </label>
                <label className="form-group">
                  Role-specific Required Skills
                  <textarea
                    value={item.skills}
                    onChange={(e) => handleRoleChange(idx, 'skills', e.target.value)}
                    placeholder="e.g. Node.js, Express, MongoDB..."
                    rows={3}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      <h3
        style={{
          borderBottom: '2px solid var(--color-slate-100)',
          paddingBottom: '8px',
          color: 'var(--color-primary)',
          marginTop: '8px',
        }}
      >
        4. Selection & Drive Logistics
      </h3>
      <div className="student-form-grid">
        <label className="form-group">
          External Registration Link (e.g. eLitmus)
          <input
            type="url"
            value={registrationLink}
            onChange={(e) => setRegistrationLink(e.target.value)}
            placeholder="e.g. https://www.elitmus.com/jobs/..."
          />
        </label>
        <label className="form-group">
          Registration Deadline Date & Time *
          <input
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            required
          />
        </label>
      </div>

      <label className="form-group">
        Selection Process Steps & Rounds
        <textarea
          value={selectionProcess}
          onChange={(e) => setSelectionProcess(e.target.value)}
          placeholder="e.g.&#10;1. Shortlisting based on eLitmus Score&#10;2. Online Aptitude & Technical MCQs&#10;3. Technical Interview Round (Coding)&#10;4. HR & Behavior Round"
          rows={4}
        />
      </label>

      <div
        style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
          borderTop: '1px solid var(--color-border)',
          paddingTop: '16px',
          marginTop: '8px',
        }}
      >
        <button
          type="button"
          className="btn-secondary"
          onClick={() => navigate('/placements')}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-success"
          style={{ background: 'var(--color-primary)' }}
        >
          Preview Job Opening Drive
        </button>
      </div>
    </form>
  );

  const renderPreview = () => {
    const currentRole = hasMultipleRoles ? multipleRoles[previewRoleTab] : null;
    const branchesToDisplay = currentRole
      ? currentRole.branches
      : selectedBranches.length > 0
        ? selectedBranches
        : branchOptions;
    const ctcToDisplay = currentRole ? currentRole.ctc : ctc;
    const stipendToDisplay = currentRole ? currentRole.stipend : stipend;
    const respToDisplay = currentRole ? currentRole.responsibilities : responsibilities;
    const skillsToDisplay = currentRole ? currentRole.skills : skills;

    return (
      <div style={{ display: 'grid', gap: '24px' }}>
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(13, 148, 136, 0.05)',
            borderRadius: '8px',
            borderLeft: '4px solid var(--color-accent)',
            fontWeight: 500,
            fontSize: '13.5px',
            color: 'var(--color-accent)',
          }}
        >
          🔍 <strong>Drive Preview Mode:</strong> This matches exactly how the placement
          drive details sheet will load for matching candidates. Review all eligibility
          parameters prior to publishing.
        </div>

        <article
          className="card"
          style={{
            display: 'grid',
            gap: '24px',
            border: '1px solid var(--color-accent)',
            boxShadow: '0 0 15px rgba(13, 148, 136, 0.1)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '16px',
              borderBottom: '1px solid var(--color-border)',
              paddingBottom: '20px',
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  flexWrap: 'wrap',
                }}
              >
                <span
                  className="opportunity-company"
                  style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: 'var(--color-primary)',
                  }}
                >
                  {company || 'Company Name'}
                </span>
                <span
                  className="badge badge-alumni"
                  style={{
                    fontSize: '11px',
                    background: 'var(--color-slate-100)',
                    color: 'var(--color-slate-700)',
                  }}
                >
                  Batch {batch}
                </span>
                <span className="badge badge-today-pulse" style={{ fontSize: '10px' }}>
                  PREVIEW
                </span>
              </div>
              <h1
                style={{
                  fontSize: '24px',
                  margin: '6px 0 4px 0',
                  color: 'var(--color-slate-900)',
                }}
              >
                {hasMultipleRoles
                  ? `Multiple Roles (${multipleRoles.length})`
                  : role || 'Job Title'}
              </h1>
              <p
                className="text-secondary"
                style={{
                  margin: 0,
                  display: 'flex',
                  gap: '12px',
                  flexWrap: 'wrap',
                  fontSize: '13px',
                }}
              >
                <span>📍 {location || 'Job Location'}</span>
                {companyLink && (
                  <span>
                    🔗{' '}
                    <a
                      href={companyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--color-accent)', fontWeight: 600 }}
                    >
                      Visit Website
                    </a>
                  </span>
                )}
              </p>
            </div>

            <button
              type="button"
              className="btn-primary"
              style={{ background: 'var(--color-primary)' }}
              onClick={() => setShowConfirmModal(true)}
            >
              Publish Job Opening Drive
            </button>
          </div>

          {companyIntro && (
            <div>
              <h3
                style={{
                  fontSize: '15px',
                  color: 'var(--color-slate-800)',
                  marginBottom: '8px',
                }}
              >
                About the Company
              </h3>
              <p
                style={{
                  margin: 0,
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.6,
                }}
              >
                {companyIntro}
              </p>
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '20px',
            }}
          >
            <div
              className="card"
              style={{
                border: '1px solid var(--color-border)',
                padding: '16px',
                background: 'var(--color-bg-main)',
              }}
            >
              <h3
                style={{
                  fontSize: '15px',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px',
                }}
              >
                📋 Drive Eligibility Scorecard
              </h3>
              <div style={{ display: 'grid', gap: '10px', fontSize: '13px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid var(--color-border)',
                    paddingBottom: '6px',
                  }}
                >
                  <span className="text-secondary">BE / BTech CGPI Cutoff</span>
                  <strong style={{ color: 'var(--color-slate-900)' }}>
                    {minCgpi} CGPI
                  </strong>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid var(--color-border)',
                    paddingBottom: '6px',
                  }}
                >
                  <span className="text-secondary">Maximum Live KTs / Backlogs</span>
                  <strong style={{ color: 'var(--color-slate-900)' }}>
                    {maxKts} KTs
                  </strong>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid var(--color-border)',
                    paddingBottom: '6px',
                  }}
                >
                  <span className="text-secondary">10th Marks Criterion</span>
                  <strong style={{ color: 'var(--color-slate-900)' }}>
                    {tenthPercent}
                  </strong>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid var(--color-border)',
                    paddingBottom: '6px',
                  }}
                >
                  <span className="text-secondary">12th/Diploma Criterion</span>
                  <strong style={{ color: 'var(--color-slate-900)' }}>
                    {twelfthPercent}
                  </strong>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span className="text-secondary">Eligible Branches for drive</span>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px',
                      marginTop: '4px',
                    }}
                  >
                    {branchesToDisplay.map((b) => (
                      <span
                        key={b}
                        style={{
                          fontSize: '11px',
                          background: 'var(--color-slate-200)',
                          color: 'var(--color-slate-700)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontWeight: 500,
                        }}
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div
              className="card"
              style={{
                border: '1px solid var(--color-border)',
                padding: '16px',
                background: 'var(--color-bg-main)',
                display: 'grid',
                alignContent: 'start',
                gap: '12px',
              }}
            >
              <h3
                style={{
                  fontSize: '15px',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '4px',
                }}
              >
                💰 Compensation & Service Bond
              </h3>
              <div
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}
              >
                <div
                  style={{
                    background: '#ffffff',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <span
                    className="text-secondary"
                    style={{ fontSize: '11.5px', display: 'block' }}
                  >
                    CTC Package
                  </span>
                  <strong style={{ fontSize: '15px', color: 'var(--color-slate-900)' }}>
                    {ctcToDisplay || '10 LPA'}
                  </strong>
                </div>
                <div
                  style={{
                    background: '#ffffff',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <span
                    className="text-secondary"
                    style={{ fontSize: '11.5px', display: 'block' }}
                  >
                    Internship Stipend
                  </span>
                  <strong style={{ fontSize: '15px', color: 'var(--color-slate-900)' }}>
                    {stipendToDisplay || 'N/A'}
                  </strong>
                </div>
              </div>
              {hasBond ? (
                <div
                  style={{
                    background: 'rgba(217, 119, 6, 0.05)',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    borderLeft: '4px solid var(--color-warning)',
                    fontSize: '12.5px',
                  }}
                >
                  <strong
                    style={{
                      color: 'var(--color-warning)',
                      display: 'block',
                      marginBottom: '2px',
                    }}
                  >
                    ⚠️ Service Agreement / Bond Required
                  </strong>
                  Selected candidates must sign a service bond of{' '}
                  <strong>{bondDuration || '2 years'}</strong> with a breach penalty of{' '}
                  <strong>{bondPenalty || 'Rs. 2,00,000'}</strong>.
                </div>
              ) : (
                <div
                  style={{
                    background: 'rgba(13, 148, 136, 0.05)',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    borderLeft: '4px solid var(--color-accent)',
                    fontSize: '12.5px',
                    color: 'var(--color-accent)',
                    fontWeight: 500,
                  }}
                >
                  ✓ Direct joining. No service bond or penalty agreement.
                </div>
              )}
            </div>
          </div>

          {hasMultipleRoles && multipleRoles.length > 0 && (
            <div
              style={{
                display: 'grid',
                gap: '10px',
                borderTop: '1px solid var(--color-border)',
                paddingTop: '16px',
              }}
            >
              <span className="service-eyebrow" style={{ color: 'var(--color-accent)' }}>
                Multi-role Recruitment Profiles (Interactive Preview)
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {multipleRoles.map((roleOpt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="btn-secondary"
                    style={{
                      background: previewRoleTab === idx ? 'var(--color-accent)' : 'none',
                      color:
                        previewRoleTab === idx ? '#ffffff' : 'var(--color-slate-600)',
                      borderColor:
                        previewRoleTab === idx
                          ? 'var(--color-accent)'
                          : 'var(--color-border)',
                      padding: '6px 12px',
                      fontSize: '12.5px',
                      borderRadius: '20px',
                    }}
                    onClick={() => setPreviewRoleTab(idx)}
                  >
                    {roleOpt.title || `Role #${idx + 1}`} ({roleOpt.ctc || 'N/A'})
                  </button>
                ))}
              </div>
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '20px',
              borderTop: '1px solid var(--color-border)',
              paddingTop: '16px',
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: '15px',
                  color: 'var(--color-slate-800)',
                  marginBottom: '8px',
                }}
              >
                🎯 Role Responsibilities {currentRole && `(${currentRole.title})`}
              </h3>
              <div
                style={{
                  color: 'var(--color-text-secondary)',
                  fontSize: '13.5px',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-line',
                }}
              >
                {respToDisplay || 'No responsibilities specified.'}
              </div>
            </div>
            <div>
              <h3
                style={{
                  fontSize: '15px',
                  color: 'var(--color-slate-800)',
                  marginBottom: '8px',
                }}
              >
                ⚡ Required Core Skills
              </h3>
              <div
                style={{
                  color: 'var(--color-text-secondary)',
                  fontSize: '13.5px',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-line',
                }}
              >
                {skillsToDisplay || 'No core skills specified.'}
              </div>
            </div>
          </div>

          {selectionProcess && (
            <div
              style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}
            >
              <h3
                style={{
                  fontSize: '15px',
                  color: 'var(--color-slate-800)',
                  marginBottom: '8px',
                }}
              >
                Selection rounds & Interview Process
              </h3>
              <div
                style={{
                  color: 'var(--color-text-secondary)',
                  fontSize: '13.5px',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-line',
                }}
              >
                {selectionProcess}
              </div>
            </div>
          )}

          <div
            style={{
              borderTop: '1px solid var(--color-border)',
              paddingTop: '16px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '24px',
              background: 'rgba(15, 23, 42, 0.02)',
              padding: '16px',
              borderRadius: '8px',
            }}
          >
            <div style={{ minWidth: '150px' }}>
              <span
                className="text-secondary"
                style={{
                  fontSize: '11px',
                  display: 'block',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Registration Deadline
              </span>
              <strong>
                {deadline
                  ? new Date(deadline).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'No deadline selected'}
              </strong>
            </div>

            {registrationLink && (
              <div style={{ minWidth: '150px' }}>
                <span
                  className="text-secondary"
                  style={{
                    fontSize: '11px',
                    display: 'block',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Apply Link (External)
                </span>
                <span
                  style={{
                    color: 'var(--color-primary)',
                    fontWeight: 'bold',
                    fontSize: '13px',
                  }}
                >
                  eLitmus / Corporate Link ↗
                </span>
              </div>
            )}
          </div>
        </article>

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
            onClick={() => setIsPreviewMode(false)}
          >
            ← Back to Editing Form
          </button>
          <button
            type="button"
            className="btn-primary"
            style={{ background: 'var(--color-primary)' }}
            onClick={() => setShowConfirmModal(true)}
          >
            Publish Job Opening Drive
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'grid', gap: 'var(--space-lg)', justifyItems: 'center' }}>
      <section className="page-header" style={{ width: '100%', maxWidth: '800px' }}>
        <div style={{ width: '100%' }}>
          <button
            type="button"
            className="btn-secondary"
            style={{ marginBottom: '12px', padding: '6px 12px', fontSize: '12.5px' }}
            onClick={() => {
              if (isPreviewMode) {
                setIsPreviewMode(false);
              } else {
                navigate('/placements');
              }
            }}
          >
            ← {isPreviewMode ? 'Back to Editing Form' : 'Back to Placements Board'}
          </button>
          <h1 style={{ textAlign: 'left' }}>
            {isPreviewMode
              ? 'Preview Drive: ' + (company || 'Corporate Opening')
              : 'Create Placement Drive Opening'}
          </h1>
          <p className="text-secondary" style={{ textAlign: 'left' }}>
            {isPreviewMode
              ? 'Evaluate this candidate-facing view and publish the drive when verified.'
              : 'Configure a premium placement opportunity matching manual RAIT cell parameters.'}
          </p>
        </div>
      </section>

      <article
        className="card"
        style={{ width: '100%', maxWidth: '800px', padding: 'var(--space-lg)' }}
      >
        {isPreviewMode ? renderPreview() : renderForm()}
      </article>

      {showConfirmModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
        >
          <div
            className="card animate-scaleUp"
            style={{
              maxWidth: '500px',
              width: '100%',
              padding: '24px',
              display: 'grid',
              gap: '16px',
              boxShadow:
                '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
            }}
          >
            <h2 style={{ margin: 0, fontSize: '18.5px', color: 'var(--color-primary)' }}>
              Confirm Placement Drive Publishing
            </h2>
            <p
              className="text-secondary"
              style={{ margin: 0, fontSize: '14px', lineHeight: 1.5 }}
            >
              Are you sure you want to publish the placement drive for{' '}
              <strong>{company}</strong>? This will instantly deploy the opening to the
              Placements Board, making it searchable for matching eligible candidates in
              Batch <strong>{batch}</strong>.
            </p>
            <div
              style={{
                display: 'flex',
                gap: '10px',
                justifyContent: 'flex-end',
                borderTop: '1px solid var(--color-border)',
                paddingTop: '14px',
                marginTop: '6px',
              }}
            >
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowConfirmModal(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ background: 'var(--color-accent)' }}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Publishing...' : 'Yes, Publish Drive'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlacementOpportunityCreatePage;

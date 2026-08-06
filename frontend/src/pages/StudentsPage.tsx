import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '../lib/legacyQuery';

import { useAuth } from '../context/AuthContext';
import { studentsAPI, StudentProfile } from '../services/api';

const StudentsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Roster filters
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [entryFilter, setEntryFilter] = useState('');
  const [page, setPage] = useState(1);

  const canManageStudents =
    user?.role === 'SUPER_ADMIN' || user?.role === 'TPO' || user?.role === 'HOD';
  const isVolunteer = user?.role === 'VOLUNTEER';

  // API students query
  const studentsQuery = useQuery(
    ['students-list', page, searchTerm],
    async () => {
      const response = await studentsAPI.list(page, searchTerm);
      return response.data;
    },
    { keepPreviousData: true },
  );

  const handleDelete = async (studentId: number) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this student record? This cannot be undone.',
      )
    ) {
      return;
    }
    try {
      await studentsAPI.delete(studentId);
      studentsQuery.refetch();
      alert('Student record deleted successfully.');
    } catch {
      alert('Unable to delete student record.');
    }
  };

  // Perform additional frontend filtering for robust filter criteria (branch, status, entry mode)
  const filteredResults = React.useMemo(() => {
    if (!studentsQuery.data?.results) return [];

    return studentsQuery.data.results.filter((s) => {
      const matchBranch =
        !branchFilter || s.branch.toLowerCase().includes(branchFilter.toLowerCase());
      const matchStatus = !statusFilter || s.status === statusFilter;
      const matchEntry = !entryFilter || s.entry_mode === entryFilter;
      return matchBranch && matchStatus && matchEntry;
    });
  }, [studentsQuery.data, branchFilter, statusFilter, entryFilter]);

  const handleAddDemoStudent = async () => {
    // Generate a quick demo student to display multiple entries
    const randomId = Math.floor(Math.random() * 1000) + 10;
    const demo: Partial<StudentProfile> = {
      id: randomId,
      full_name: 'Sneha Kulkarni',
      email: `sneha.${randomId}@college.edu`,
      college_roll_no: `CSE2023-${randomId}`,
      admission_year: 2023,
      entry_mode: 'REGULAR',
      program_duration_years: 4,
      expected_graduation_year: 2027,
      current_academic_year: 3,
      status: 'ACTIVE',
      student_whatsapp_number: '+919900000005',
      parent_whatsapp_number: '+919900000055',
      parent_email: 'parent.sneha@example.com',
      gender: 'FEMALE',
      nationality: 'Indian',
      residential_address: 'Model Colony',
      residential_city: 'Pune',
      pin_code: '411016',
      native_place: 'Kolhapur',
      current_location: 'Pune',
      branch: 'Computer Engineering',
      major_minor_subject: 'Cybersecurity',
      division: 'B',
      batch: 'Batch 2023',
      is_active: true,
      academic_history: {
        tenth_percentage: '92.4',
        tenth_year_of_passing: 2021,
        tenth_board: 'CBSE',
        twelfth_or_diploma_type: '12TH',
        twelfth_or_diploma_percentage: '89.1',
        twelfth_or_diploma_year_of_passing: 2023,
        twelfth_board: 'CBSE',
        btech_sem1_sgpi: '8.8',
        btech_sem2_sgpi: '9.0',
        btech_sem3_sgpi: '8.9',
        btech_sem4_sgpi: '9.1',
        se_cgpi: '8.95',
        se_percentage: '84.8',
        live_kt: 0,
        dead_kt: 0,
        drop_count: 0,
        gap_count: 0,
        courses_done_text: 'Java, Cloud Architect',
        internships_text: 'Web dev intern at TechSolutons',
      },
      compliance: {
        aadhaar_number: '987654321012',
        pan_number: 'PQRSH9876K',
      },
    };

    try {
      await studentsAPI.create(demo);
      studentsQuery.refetch();
      alert('Demo student added successfully!');
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Error creating student.');
    }
  };

  return (
    <div style={{ display: 'grid', gap: 'var(--space-lg)' }}>
      <section className="page-header">
        <div>
          <h1>Students Directory</h1>
          <p className="text-secondary">
            {canManageStudents
              ? 'TPO/Admin View: View, edit, add, and remove student profiles.'
              : 'Volunteer View: Roster helper access. Search profiles and assist with resume uploads.'}
          </p>
        </div>
        {canManageStudents && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleAddDemoStudent}
            >
              Quick Add Demo Student
            </button>
          </div>
        )}
      </section>

      <section className="students-layout">
        {/* Side filter panel */}
        <aside
          className="card"
          style={{ display: 'grid', gap: '14px', position: 'sticky', top: '18px' }}
        >
          <h3>Search & Filters</h3>

          <div className="form-group">
            <label htmlFor="search">Search Student</label>
            <input
              id="search"
              type="text"
              placeholder="Search by name, roll no, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="branch">Branch</label>
            <select
              id="branch"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
            >
              <option value="">All Branches</option>
              <option value="Computer Engineering">Computer Engineering (CE)</option>
              <option value="Computer Science Business Systems">
                Computer Science Business Systems (CSBS)
              </option>
              <option value="AI/ML">CSE AI/ML</option>
              <option value="AI/DS">CSE AI/DS</option>
              <option value="Cybersecurity">CSE Cybersecurity</option>
              <option value="Information Technology">Information Technology (IT)</option>
              <option value="Electronics and Telecommunications">
                Electronics & Telecommunications (EXTC)
              </option>
              <option value="Electronics and Computer">
                Electronics & Computer (ECE)
              </option>
              <option value="Instrumentation">Instrumentation Engineering (IE)</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="status">Academic Status</label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="ALUMNI">Alumni</option>
              <option value="EXTENDED">Extended</option>
              <option value="GRADUATED">Graduated</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="entry">Entry Mode</label>
            <select
              id="entry"
              value={entryFilter}
              onChange={(e) => setEntryFilter(e.target.value)}
            >
              <option value="">All Modes</option>
              <option value="REGULAR">Regular Track (4 Yrs)</option>
              <option value="LATERAL_DIPLOMA">Lateral Diploma (3 Yrs)</option>
            </select>
          </div>

          {(branchFilter || statusFilter || entryFilter || searchTerm) && (
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: '6px', fontSize: '11px', marginTop: '6px' }}
              onClick={() => {
                setBranchFilter('');
                setStatusFilter('');
                setEntryFilter('');
                setSearchTerm('');
              }}
            >
              Reset Filters
            </button>
          )}
        </aside>

        {/* Directory Grid */}
        <section style={{ display: 'grid', gap: 'var(--space-md)' }}>
          {studentsQuery.isLoading && (
            <article className="card">Loading student profiles...</article>
          )}
          {studentsQuery.isError && (
            <article className="card form-error">
              Could not fetch students from TPO server.
            </article>
          )}

          {!studentsQuery.isLoading && !studentsQuery.isError && (
            <article className="card">
              <div className="student-directory-table-wrapper">
                <table className="student-directory-table">
                  <thead>
                    <tr>
                      <th>Student Details</th>
                      <th>Roll Number</th>
                      <th>Branch & Batch</th>
                      <th>CGPI / KT</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResults.map((student) => (
                      <tr key={student.id}>
                        <td>
                          <strong
                            style={{
                              display: 'block',
                              fontSize: '14px',
                              color: 'var(--color-slate-900)',
                            }}
                          >
                            {student.full_name}
                          </strong>
                          <span className="table-subtext">{student.email}</span>
                          <span
                            className={`badge ${
                              student.status === 'ACTIVE'
                                ? 'badge-active'
                                : student.status === 'ALUMNI'
                                  ? 'badge-alumni'
                                  : student.status === 'EXTENDED'
                                    ? 'badge-extended'
                                    : 'badge-graduated'
                            }`}
                            style={{ marginTop: '4px' }}
                          >
                            {student.status}
                          </span>
                        </td>
                        <td>
                          <code
                            style={{
                              fontSize: '12.5px',
                              background: 'var(--color-slate-100)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            {student.college_roll_no}
                          </code>
                        </td>
                        <td>
                          <span style={{ display: 'block', fontWeight: 500 }}>
                            {student.branch}
                          </span>
                          <span className="table-subtext">
                            {student.batch || 'Batch unset'}
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: 'var(--color-slate-900)' }}>
                            {student.academic_history?.se_cgpi || 'N/A'} CGPI
                          </strong>
                          <span
                            className="table-subtext"
                            style={{
                              color: student.academic_history?.live_kt
                                ? 'var(--color-error)'
                                : 'var(--color-slate-500)',
                            }}
                          >
                            {student.academic_history?.live_kt ?? 0} Live KTs
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <Link
                              to={`/students/${student.id}`}
                              className="btn-secondary button-link"
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                            >
                              View
                            </Link>

                            {/* Volunteer or Admin can Edit details */}
                            <Link
                              to={`/students/${student.id}/edit`}
                              className="btn-success button-link"
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                            >
                              Edit
                            </Link>

                            {/* Only TPO / Admins can delete student profile */}
                            {canManageStudents && (
                              <button
                                type="button"
                                className="btn-danger"
                                style={{ padding: '6px 12px', fontSize: '12px' }}
                                onClick={() => void handleDelete(student.id)}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredResults.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '24px' }}>
                          No students matched your search criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </article>
          )}
        </section>
      </section>
    </div>
  );
};

export default StudentsPage;

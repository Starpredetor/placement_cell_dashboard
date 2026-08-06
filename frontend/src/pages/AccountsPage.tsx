import React from 'react';
import { useQuery } from '../lib/legacyQuery';

import { useAuth } from '../context/AuthContext';
import { authAPI, AuthUser, trainingAPI } from '../services/api';

const roleLabels: Record<AuthUser['role'], string> = {
  SUPER_ADMIN: 'Super Admin (Django Default)',
  TPO: 'TPO - Full Access',
  HOD: 'HOD - Full Access',
  VOLUNTEER: 'Volunteer - Limited Access',
  STUDENT: 'Student - Student Module Access',
};

const assignableRolesByActor: Record<AuthUser['role'], AuthUser['role'][]> = {
  SUPER_ADMIN: ['HOD', 'TPO', 'VOLUNTEER', 'STUDENT'],
  HOD: ['VOLUNTEER', 'STUDENT'],
  TPO: ['VOLUNTEER', 'STUDENT'],
  VOLUNTEER: [],
  STUDENT: [],
};

type EditState = {
  username: string;
  email: string;
  role: AuthUser['role'];
  is_active: boolean;
};

const AccountsPage: React.FC = () => {
  const { user } = useAuth();
  const [savingId, setSavingId] = React.useState<number | null>(null);
  const [message, setMessage] = React.useState<string>('');
  const [error, setError] = React.useState<string>('');
  const [searchTerm, setSearchTerm] = React.useState<string>('');
  const [editState, setEditState] = React.useState<Record<number, EditState>>({});

  // Batch & Rollover states
  const [newBatchName, setNewBatchName] = React.useState('');
  const [showAddBatch, setShowAddBatch] = React.useState(false);
  const [rolloverStatus, setRolloverStatus] = React.useState('');

  const canManageUsers =
    user?.role === 'SUPER_ADMIN' || user?.role === 'TPO' || user?.role === 'HOD';

  const usersQuery = useQuery(
    ['accounts-users'],
    async () => {
      const response = await authAPI.users();
      return response.data;
    },
    { enabled: canManageUsers },
  );

  const batchesQuery = useQuery(
    ['training-batches-list'],
    async () => {
      const response = await trainingAPI.batches();
      return response.data?.results || [];
    },
    { enabled: canManageUsers },
  );

  const batches = batchesQuery.data || [];

  React.useEffect(() => {
    if (!usersQuery.data) {
      return;
    }

    const mapped: Record<number, EditState> = {};
    usersQuery.data.forEach((u) => {
      mapped[u.id] = {
        username: u.username,
        email: u.email,
        role: u.role,
        is_active: u.is_active,
      };
    });
    setEditState(mapped);
  }, [usersQuery.data]);

  const assignableRoles = user ? assignableRolesByActor[user.role] : [];

  const filteredUsers = React.useMemo(() => {
    if (!usersQuery.data) {
      return [] as AuthUser[];
    }

    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return usersQuery.data;
    }

    return usersQuery.data.filter((u) => {
      const row = editState[u.id];
      const username = row?.username ?? u.username;
      const email = row?.email ?? u.email;
      const role = row?.role ?? u.role;
      const status = (row?.is_active ?? u.is_active) ? 'active' : 'inactive';

      const haystack = [
        String(u.id),
        username,
        email,
        role,
        roleLabels[role],
        u.first_name,
        u.last_name,
        `${u.first_name} ${u.last_name}`.trim(),
        status,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [usersQuery.data, searchTerm, editState]);

  const updateRow = (id: number, patch: Partial<EditState>) => {
    setEditState((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        ...patch,
      },
    }));
  };

  const handleSave = async (targetId: number) => {
    setMessage('');
    setError('');
    const row = editState[targetId];
    if (!row) {
      return;
    }

    try {
      setSavingId(targetId);
      await authAPI.updateUser(targetId, row);
      await usersQuery.refetch();
      setMessage('Account updated successfully.');
    } catch (apiError: any) {
      const payload = apiError?.response?.data;
      const firstError =
        payload?.detail ||
        payload?.username?.[0] ||
        payload?.email?.[0] ||
        payload?.role?.[0] ||
        'Unable to update account.';
      setError(firstError);
    } finally {
      setSavingId(null);
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchName.trim()) {
      alert('Please enter a batch name.');
      return;
    }

    setMessage('');
    setError('');
    try {
      await trainingAPI.createBatch({
        name: newBatchName.trim(),
        is_active: true,
      });
      batchesQuery.refetch();
      setNewBatchName('');
      setShowAddBatch(false);
      setMessage('Batch created successfully.');
    } catch {
      setError('Unable to create batch.');
    }
  };

  const handleRollover = async () => {
    if (
      !window.confirm(
        'Are you sure you want to execute the Academic Year Rollover?\n\nThis will:\n1. Graduate current 4th-year students (moved to ALUMNI/GRADUATED).\n2. Promote 3rd-year students to 4th-year (placement only, no training).\n3. Promote 2nd-year students to 3rd-year (active for both placements & training sessions).\n\nThis action is irreversible.',
      )
    )
      return;

    setMessage('');
    setError('');
    try {
      const response = await trainingAPI.rollover();
      const data = response.data;
      setRolloverStatus(
        `Success! Archived: ${data.archived_count} | 4th-years: ${data.promoted_to_4th_placement_only} | 3rd-years: ${data.promoted_to_3rd_training_and_placement}`,
      );
      setMessage('Academic Year Rollover completed successfully!');
    } catch {
      setError('Unable to run academic rollover.');
    }
  };

  return (
    <main>
      <header className="page-header">
        <div>
          <h1>Accounts & Role Management</h1>
          <p className="text-secondary">
            Signed in as <strong>{user?.username}</strong> ({user?.role})
          </p>
        </div>
      </header>

      <section className="card" style={{ marginTop: '1rem' }}>
        <h2>Managed Accounts</h2>
        {!canManageUsers && (
          <p>
            You currently have {user?.role} access. Account management is available for
            SUPER_ADMIN, TPO, and HOD roles only.
          </p>
        )}
        {canManageUsers && usersQuery.isLoading && <p>Loading users...</p>}
        {canManageUsers && usersQuery.isError && <p>Could not load users.</p>}

        {message && <p className="form-success">{message}</p>}
        {error && <p className="form-error">{error}</p>}

        {canManageUsers && (
          <input
            className="global-search"
            type="search"
            placeholder="Search by username, email, role, status, name, or ID..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            aria-label="Search accounts"
          />
        )}

        {canManageUsers &&
          !usersQuery.isLoading &&
          !usersQuery.isError &&
          usersQuery.data && (
            <div className="accounts-table-wrapper">
              <table className="accounts-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const row = editState[u.id];
                    if (!row) {
                      return null;
                    }

                    return (
                      <tr key={u.id}>
                        <td>
                          <input
                            value={row.username}
                            onChange={(event) =>
                              updateRow(u.id, { username: event.target.value })
                            }
                          />
                        </td>
                        <td>
                          <input
                            value={row.email}
                            onChange={(event) =>
                              updateRow(u.id, { email: event.target.value })
                            }
                          />
                        </td>
                        <td>
                          <select
                            value={row.role}
                            onChange={(event) =>
                              updateRow(u.id, {
                                role: event.target.value as AuthUser['role'],
                              })
                            }
                          >
                            {[...new Set([row.role, ...assignableRoles])].map((role) => (
                              <option key={role} value={role}>
                                {roleLabels[role]}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <label>
                            <input
                              type="checkbox"
                              checked={row.is_active}
                              onChange={(event) =>
                                updateRow(u.id, { is_active: event.target.checked })
                              }
                            />{' '}
                            Active
                          </label>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn-primary"
                            onClick={() => void handleSave(u.id)}
                            disabled={savingId === u.id}
                          >
                            {savingId === u.id ? 'Saving...' : 'Save'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={5}>No accounts found for the current search.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
      </section>

      {canManageUsers && (
        <section
          className="card"
          style={{ marginTop: '2rem', borderTop: '4px solid var(--color-primary)' }}
        >
          <h2>High Security Data Operations</h2>
          <p
            className="text-secondary"
            style={{ fontSize: '13px', marginBottom: '20px' }}
          >
            Warning: These operations transform essential cohort data. Access is
            restricted to SUPER_ADMIN and TPO Roles only.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '20px',
            }}
          >
            {/* Create Batch Card */}
            <div
              style={{
                border: '1px solid var(--color-border)',
                padding: '16px',
                borderRadius: '6px',
                display: 'grid',
                gap: '12px',
              }}
            >
              <h4>Academic Cohort Batches</h4>
              <p className="text-secondary" style={{ fontSize: '12.5px', margin: 0 }}>
                Define a new student cohort batch. Newly created programs and lectures can
                be targeted to specific cohorts.
              </p>

              <div style={{ fontSize: '13px', fontWeight: 'bold' }}>
                Active Batches:{' '}
                {batches.map((b: any) => b.name).join(', ') || 'None loaded'}
              </div>

              {showAddBatch ? (
                <form
                  onSubmit={handleCreateBatch}
                  style={{ display: 'grid', gap: '10px' }}
                >
                  <input
                    type="text"
                    placeholder="Batch Name, e.g. Batch 2026"
                    value={newBatchName}
                    onChange={(e) => setNewBatchName(e.target.value)}
                    style={{ padding: '8px', fontSize: '13px' }}
                  />
                  <div
                    style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}
                  >
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setShowAddBatch(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-success">
                      Save
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ justifySelf: 'start' }}
                  onClick={() => setShowAddBatch(true)}
                >
                  Create New Cohort Batch
                </button>
              )}
            </div>

            {/* Academic Rollover Card */}
            <div
              style={{
                border: '1px solid var(--color-border)',
                padding: '16px',
                borderRadius: '6px',
                display: 'grid',
                gap: '12px',
              }}
            >
              <h4>Academic Year Rollover Promotion</h4>
              <p className="text-secondary" style={{ fontSize: '12.5px', margin: 0 }}>
                Executes end-of-year roster rollover. Promotes 3rd-years to 4th-years,
                2nd-years to 3rd-years, and moves graduating students to historical alumni
                archives.
              </p>
              {rolloverStatus && (
                <div
                  style={{
                    padding: '8px',
                    backgroundColor: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                    fontSize: '12px',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                  }}
                >
                  {rolloverStatus}
                </div>
              )}
              <button
                type="button"
                className="btn-primary"
                style={{ justifySelf: 'start', backgroundColor: 'var(--color-primary)' }}
                onClick={handleRollover}
              >
                Execute Academic Year Rollover
              </button>
            </div>
          </div>
        </section>
      )}
    </main>
  );
};

export default AccountsPage;

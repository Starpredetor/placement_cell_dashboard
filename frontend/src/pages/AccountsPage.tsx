import React, { useMemo } from 'react';
import { useQuery } from 'react-query';

import { useAuth } from '../context/AuthContext';
import { authAPI, AuthUser } from '../services/api';

const roleLabels: Record<AuthUser['role'], string> = {
  SUPER_ADMIN: 'Super Admin (Django Default)',
  TPO: 'TPO - Full Access',
  HOD: 'HOD - Full Access',
  VOLUNTEER: 'Volunteer - Limited Access',
  STUDENT: 'Student - Student Module Access',
};

const AccountsPage: React.FC = () => {
  const { user, logout } = useAuth();

  const canManageUsers = user?.role === 'SUPER_ADMIN' || user?.role === 'TPO' || user?.role === 'HOD';

  const usersQuery = useQuery(
    ['accounts-users'],
    async () => {
      const response = await authAPI.users();
      return response.data;
    },
    { enabled: canManageUsers }
  );

  const usersByRole = useMemo(() => {
    const users = usersQuery.data || [];
    return users.reduce<Record<string, AuthUser[]>>((acc, current) => {
      const key = current.role;
      if (!acc[key]) acc[key] = [];
      acc[key].push(current);
      return acc;
    }, {});
  }, [usersQuery.data]);

  return (
    <main style={{ maxWidth: 980, margin: '2rem auto', padding: '0 1rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ marginBottom: 0 }}>Accounts</h1>
          <p style={{ marginTop: '0.5rem' }}>
            Signed in as <strong>{user?.email}</strong> ({user?.role})
          </p>
        </div>
        <button onClick={() => void logout()} style={{ padding: '0.5rem 0.9rem' }}>
          Logout
        </button>
      </header>

      <section style={{ marginTop: '2rem' }}>
        <h2>Expected User Types</h2>
        <ul>
          {Object.entries(roleLabels).map(([key, label]) => (
            <li key={key}>{label}</li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>Users</h2>
        {!canManageUsers && (
          <p>
            You currently have {user?.role} access. User list management is available for Super Admin, TPO,
            and HOD roles.
          </p>
        )}
        {canManageUsers && usersQuery.isLoading && <p>Loading users...</p>}
        {canManageUsers && usersQuery.isError && <p>Could not load users.</p>}
        {canManageUsers && !usersQuery.isLoading && !usersQuery.isError && (
          <div>
            {Object.entries(usersByRole).map(([role, users]) => (
              <div key={role} style={{ marginBottom: '1.5rem' }}>
                <h3>{roleLabels[role as AuthUser['role']]}</h3>
                <ul>
                  {users.map((u) => (
                    <li key={u.id}>
                      {u.first_name || u.last_name
                        ? `${u.first_name} ${u.last_name}`.trim()
                        : u.username}{' '}
                      - {u.email}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default AccountsPage;

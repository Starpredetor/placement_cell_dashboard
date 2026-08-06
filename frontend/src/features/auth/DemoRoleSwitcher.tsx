import React from 'react';

import { authAPI, DemoAccount } from '../../services/api';

interface DemoRoleSwitcherProps {
  onPick: (email: string, password: string) => void;
  disabled?: boolean;
}

/**
 * One-click sign-in for each seeded role.
 *
 * The account list comes from the API, which serves it only when the backend
 * runs with APP_ENV=development and 404s otherwise. Two independent gates —
 * this build-time check and the server's — mean neither a production bundle
 * nor a production API can expose the credentials on its own.
 *
 * The buttons perform an ordinary login and receive an ordinary JWT. This is a
 * convenience over real authentication, not a bypass of it.
 */
const DemoRoleSwitcher: React.FC<DemoRoleSwitcherProps> = ({ onPick, disabled }) => {
  const [accounts, setAccounts] = React.useState<DemoAccount[]>([]);

  React.useEffect(() => {
    if (!import.meta.env.DEV) return;

    let cancelled = false;
    authAPI
      .demoAccounts()
      .then((response) => {
        if (!cancelled) setAccounts(response.data);
      })
      .catch(() => {
        // Backend is not in development mode, or is unreachable. Either way the
        // switcher simply does not render — the normal form still works.
        if (!cancelled) setAccounts([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!import.meta.env.DEV || accounts.length === 0) return null;

  return (
    <div className="login-roles">
      <p>Demo access — sign in as any role</p>
      <div
        className="login-roles-grid"
        style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}
      >
        {accounts.map((account) => (
          <button
            key={account.role}
            type="button"
            className="role-pill"
            title={account.description}
            disabled={disabled}
            onClick={() => onPick(account.email, account.password)}
          >
            {account.label}
          </button>
        ))}
      </div>
      <p style={{ fontSize: '11px', color: 'var(--color-slate-500)', marginTop: '8px' }}>
        Development only. Each button performs a real sign-in.
      </p>
    </div>
  );
};

export default DemoRoleSwitcher;

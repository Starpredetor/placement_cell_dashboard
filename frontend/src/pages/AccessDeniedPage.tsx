import React from 'react';
import { Link } from 'react-router-dom';

const AccessDeniedPage: React.FC = () => {
  return (
    <div className="card access-denied">
      <div className="access-denied-icon">🔒</div>
      <h1>Access Restricted</h1>
      <p className="text-secondary" style={{ maxWidth: '480px', margin: '8px auto 24px' }}>
        You do not have permission to view this page. This area of the Placement CRM is reserved for authorized roles. If you believe this is an error, please reach out to your administrator.
      </p>
      <div>
        <Link className="btn-primary button-link" to="/dashboard">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default AccessDeniedPage;

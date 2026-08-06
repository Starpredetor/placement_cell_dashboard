import React from 'react';
import { Navigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import AccessDeniedPage from '../pages/AccessDeniedPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('SUPER_ADMIN' | 'TPO' | 'HOD' | 'VOLUNTEER' | 'STUDENT')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '80vh' }}>
        <div
          style={{
            textAlign: 'center',
            color: 'var(--color-primary)',
            fontWeight: 'bold',
          }}
        >
          Loading CRM Session...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <AccessDeniedPage />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

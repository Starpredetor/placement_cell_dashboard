import React from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import DemoRoleSwitcher from '../features/auth/DemoRoleSwitcher';

type LoginFormValues = {
  email: string;
  password: string;
};

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading } = useAuth();
  const [error, setError] = React.useState<string>('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>();

  const onSubmit = async (data: LoginFormValues) => {
    setError('');
    try {
      await login(data.email, data.password);
      navigate('/dashboard', { replace: true });
    } catch {
      setError('Invalid credentials. Please try again.');
    }
  };

  const handleDemoLogin = (email: string, password: string) => {
    setError('');
    setValue('email', email);
    setValue('password', password);
    void onSubmit({ email, password });
  };

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="login-page">
      <div className="login-bg-shape" />
      <div className="card login-card">
        <h1 style={{ marginTop: '0', textAlign: 'center' }}>Placement CRM</h1>
        <p>Sign in to access your dashboard</p>

        <form onSubmit={handleSubmit(onSubmit)} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="name@college.edu"
              {...register('email', { required: 'Email is required' })}
            />
            {errors.email && <p className="form-error">{errors.email.message}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              {...register('password', { required: 'Password is required' })}
            />
            {errors.password && <p className="form-error">{errors.password.message}</p>}
          </div>

          {error && <p className="form-error">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="btn-primary login-submit"
          >
            {isSubmitting || isLoading ? 'Signing in...' : 'Sign In'}
          </button>

          <button
            type="button"
            className="link-button"
            style={{
              textAlign: 'center',
              color: 'var(--color-slate-400)',
              textDecoration: 'none',
              fontSize: '12px',
            }}
            onClick={() => alert('Demo build — use the role buttons below to sign in.')}
          >
            Forgot your password?
          </button>
        </form>

        <DemoRoleSwitcher onPick={handleDemoLogin} disabled={isSubmitting || isLoading} />
      </div>
    </div>
  );
};

export default LoginPage;

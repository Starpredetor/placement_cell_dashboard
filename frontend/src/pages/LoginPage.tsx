import React from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

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

  const handleQuickLogin = (role: 'student' | 'volunteer' | 'tpo' | 'admin') => {
    setError('');
    let email = '';
    let password = '';

    if (role === 'admin') {
      email = 'admin@college.edu';
      password = 'admin1234';
    } else if (role === 'student') {
      email = 'student@college.edu';
      password = 'student1234';
    } else if (role === 'tpo') {
      email = 'tpo@college.edu';
      password = 'tpo12345';
    } else if (role === 'volunteer') {
      email = 'volunteer@college.edu';
      password = 'volunteer1234';
    }

    setValue('email', email);
    setValue('password', password);

    // Auto submit
    onSubmit({ email, password });
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
            onClick={() =>
              alert(
                'Demo Mode: Use the Quick Demo Access pills below to log in instantly!',
              )
            }
          >
            Forgot your password?
          </button>
        </form>

        <div className="login-roles">
          <p>Quick Demo Access</p>
          <div
            className="login-roles-grid"
            style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}
          >
            <button
              type="button"
              className="role-pill"
              onClick={() => handleQuickLogin('student')}
            >
              Student
            </button>
            <button
              type="button"
              className="role-pill"
              onClick={() => handleQuickLogin('volunteer')}
            >
              Volunteer
            </button>
            <button
              type="button"
              className="role-pill"
              onClick={() => handleQuickLogin('tpo')}
            >
              TPO Admin
            </button>
            <button
              type="button"
              className="role-pill"
              onClick={() => handleQuickLogin('admin')}
            >
              Super Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

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

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="login-page">
      <div className="login-bg-shape" />
      <div className="card login-card">
        <h1>Welcome Back</h1>
        <p className="text-secondary">Sign in to continue.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
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

          <button type="submit" disabled={isSubmitting || isLoading} className="btn-primary login-submit">
            {isSubmitting || isLoading ? 'Signing in...' : 'Login'}
          </button>

          <button type="button" className="link-button" onClick={() => alert('Forgot password flow will be added next.') }>
            Forgot password?
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;

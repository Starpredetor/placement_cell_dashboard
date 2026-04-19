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
      navigate('/accounts', { replace: true });
    } catch {
      setError('Invalid credentials. Please try again.');
    }
  };

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/accounts" replace />;
  }

  return (
    <div style={{ maxWidth: 420, margin: '4rem auto', padding: '2rem', border: '1px solid #ddd', borderRadius: 8 }}>
      <h1 style={{ marginTop: 0 }}>Sign In</h1>
      <p>Use your account email and password.</p>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
            {...register('email', { required: 'Email is required' })}
          />
          {errors.email && <p style={{ color: '#b00020' }}>{errors.email.message}</p>}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
            {...register('password', { required: 'Password is required' })}
          />
          {errors.password && <p style={{ color: '#b00020' }}>{errors.password.message}</p>}
        </div>

        {error && <p style={{ color: '#b00020' }}>{error}</p>}

        <button type="submit" disabled={isSubmitting || isLoading} style={{ padding: '0.6rem 1rem' }}>
          {isSubmitting || isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;

import React from 'react';
import { useForm } from 'react-hook-form';

import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

type ProfileFormValues = {
  username: string;
};

type PasswordFormValues = {
  current_password: string;
  new_password: string;
  confirm_password: string;
};

const allowedRoles = ['SUPER_ADMIN', 'TPO', 'HOD', 'VOLUNTEER'] as const;

const ProfilePage: React.FC = () => {
  const { user, setUser } = useAuth();
  const [profileMessage, setProfileMessage] = React.useState<string>('');
  const [passwordMessage, setPasswordMessage] = React.useState<string>('');
  const [profileError, setProfileError] = React.useState<string>('');
  const [passwordError, setPasswordError] = React.useState<string>('');

  const canManageBasicProfile = user ? (allowedRoles as readonly string[]).includes(user.role) : false;

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { isSubmitting: isSubmittingProfile },
  } = useForm<ProfileFormValues>({
    defaultValues: {
      username: user?.username || '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPasswordForm,
    formState: { isSubmitting: isSubmittingPassword },
  } = useForm<PasswordFormValues>();

  const onSubmitProfile = async (data: ProfileFormValues) => {
    setProfileMessage('');
    setProfileError('');

    try {
      const response = await authAPI.updateMe({ username: data.username });
      setUser(response.data);
      setProfileMessage('Username updated successfully.');
    } catch (error: any) {
      const backendMessage = error?.response?.data?.username?.[0] || error?.response?.data?.detail;
      setProfileError(backendMessage || 'Unable to update username.');
    }
  };

  const onSubmitPassword = async (data: PasswordFormValues) => {
    setPasswordMessage('');
    setPasswordError('');

    try {
      await authAPI.changePassword(data);
      setPasswordMessage('Password updated successfully. Please use the new password next time.');
      resetPasswordForm();
    } catch (error: any) {
      const payload = error?.response?.data;
      const firstError =
        payload?.current_password?.[0] ||
        payload?.new_password?.[0] ||
        payload?.confirm_password?.[0] ||
        payload?.detail;
      setPasswordError(firstError || 'Unable to update password.');
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div>
      <section className="page-header">
        <div>
          <h1>User Profile</h1>
          <p className="text-secondary">Manage your account credentials.</p>
        </div>
      </section>

      {!canManageBasicProfile && (
        <article className="card">
          <h2>Limited Profile Access</h2>
          <p>
            Profile editing from this page is available for SUPER_ADMIN, TPO, HOD, and VOLUNTEER roles only.
          </p>
        </article>
      )}

      {canManageBasicProfile && (
        <div className="profile-grid">
          <article className="card">
            <h2>Basic Account Details</h2>
            <p className="text-secondary">Update your username.</p>
            <form className="profile-form" onSubmit={handleSubmitProfile(onSubmitProfile)}>
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input id="username" type="text" {...registerProfile('username', { required: true, minLength: 3 })} />
              </div>

              {profileError && <p className="form-error">{profileError}</p>}
              {profileMessage && <p className="form-success">{profileMessage}</p>}

              <button type="submit" className="btn-primary" disabled={isSubmittingProfile}>
                {isSubmittingProfile ? 'Updating...' : 'Update Username'}
              </button>
            </form>
          </article>

          <article className="card">
            <h2>Change Password</h2>
            <p className="text-secondary">Keep your account secure with a strong password.</p>
            <form className="profile-form" onSubmit={handleSubmitPassword(onSubmitPassword)}>
              <div className="form-group">
                <label htmlFor="current_password">Current Password</label>
                <input id="current_password" type="password" {...registerPassword('current_password', { required: true })} />
              </div>
              <div className="form-group">
                <label htmlFor="new_password">New Password</label>
                <input id="new_password" type="password" {...registerPassword('new_password', { required: true, minLength: 8 })} />
              </div>
              <div className="form-group">
                <label htmlFor="confirm_password">Confirm New Password</label>
                <input id="confirm_password" type="password" {...registerPassword('confirm_password', { required: true, minLength: 8 })} />
              </div>

              {passwordError && <p className="form-error">{passwordError}</p>}
              {passwordMessage && <p className="form-success">{passwordMessage}</p>}

              <button type="submit" className="btn-success" disabled={isSubmittingPassword}>
                {isSubmittingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </article>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;

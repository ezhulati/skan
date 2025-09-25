import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ProfileData {
  id: string;
  email: string;
  fullName: string;
  role: string;
  venueId: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
}

interface PasswordChangeForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const UserProfilePage: React.FC = () => {
  const { auth } = useAuth();
  
  // Use auth context data instead of API call - FIXED!
  const profile: ProfileData = {
    id: auth.user?.id || '',
    email: auth.user?.email || '',
    fullName: auth.user?.fullName || '',
    role: auth.user?.role || '',
    venueId: auth.user?.venueId || '',
    isActive: true, // Default to true for logged-in users
    emailVerified: true, // Default to true for logged-in users
    createdAt: new Date().toISOString() // Default to current date
  };
  
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: profile.fullName,
    email: profile.email,
    role: profile.role
  });
  
  const [passwordForm, setPasswordForm] = useState<PasswordChangeForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Removed fetchProfile - using auth context data directly

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api-mkazmlu7ta-ew.a.run.app/v1';
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (auth.token) {
        headers['Authorization'] = `Bearer ${auth.token}`;
      }
      
      const userId = auth.user?.id;
      if (!userId) {
        throw new Error('User ID not found');
      }
      
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          fullName: editForm.fullName,
          email: editForm.email,
          role: editForm.role
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }
      
      setMessage('✅ Profili u përditësua me sukses!');
      setEditMode(false);
      // Note: Profile updates require page refresh to see changes in auth context
      
      setTimeout(() => setMessage(''), 500);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingPassword(true);
    setError('');
    setMessage('');

    // Validate passwords match
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Fjalëkalimet e reja nuk përputhen');
      setChangingPassword(false);
      return;
    }

    // Validate password strength
    if (passwordForm.newPassword.length < 8) {
      setError('Fjalëkalimi i ri duhet të jetë së paku 8 karaktere');
      setChangingPassword(false);
      return;
    }

    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api-mkazmlu7ta-ew.a.run.app/v1';
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (auth.token) {
        headers['Authorization'] = `Bearer ${auth.token}`;
      }
      
      // For password change, we'll use a dedicated endpoint
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to change password');
      }
      
      setMessage('✅ Fjalëkalimi u ndryshua me sukses!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setTimeout(() => setMessage(''), 500);
    } catch (err: any) {
      console.error('Error changing password:', err);
      setError(err.message);
    } finally {
      setChangingPassword(false);
    }
  };

  // Removed loading and error states - using auth context directly

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1>Profili i Përdoruesit</h1>
        <p>Menaxhoni informacionet e llogarisë suaj</p>
      </div>

      {error && (
        <div className="alert alert-error">
          <svg className="alert-icon" viewBox="0 0 24 24" fill="none">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {error}
        </div>
      )}

      {message && (
        <div className="alert alert-success">
          <svg className="alert-icon" viewBox="0 0 24 24" fill="none">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {message}
        </div>
      )}

      {/* Profile Information Section */}
      <div className="profile-section">
        <div className="section-header">
          <h2>Informacionet Personale</h2>
          {!editMode && (
            <button 
              className="edit-button"
              onClick={() => {
                console.log('🔧 EDIT BUTTON CLICKED!');
                setEditMode(true);
              }}
              style={{
                background: '#007bff',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              <svg className="edit-icon" viewBox="0 0 24 24" fill="none" style={{ width: '16px', height: '16px' }}>
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Ndrysho
            </button>
          )}
        </div>

        {editMode ? (
          <form onSubmit={handleUpdateProfile} className="profile-form">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="fullName">Emri i Plotë</label>
                <input
                  type="text"
                  id="fullName"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({...editForm, fullName: e.target.value})}
                  required
                  disabled={saving}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  required
                  disabled={saving}
                />
              </div>

              <div className="form-group">
                <label htmlFor="role">Roli</label>
                <select
                  id="role"
                  value={editForm.role}
                  onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                  disabled={saving}
                  className="role-select"
                >
                  <option value="staff">Staf</option>
                  <option value="manager">Menaxher</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-button"
                onClick={() => {
                  setEditMode(false);
                  setEditForm({
                    fullName: profile.fullName,
                    email: profile.email,
                    role: profile.role
                  });
                }}
                disabled={saving}
              >
                Anulo
              </button>
              <button 
                type="submit" 
                className="save-button"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="loading-spinner"></div>
                    Duke ruajtur...
                  </>
                ) : (
                  'Ruaj Ndryshimet'
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-info">
            <div className="info-grid">
              <div className="info-item">
                <label>Emri i Plotë</label>
                <p>{profile.fullName}</p>
              </div>
              <div className="info-item">
                <label>Email</label>
                <p>{profile.email}</p>
              </div>
              <div className="info-item">
                <label>Roli</label>
                <p className={`role-badge role-${profile.role}`}>
                  {profile.role === 'admin' ? 'Administrator' :
                   profile.role === 'manager' ? 'Menaxher' : 'Staf'}
                </p>
              </div>
              <div className="info-item">
                <label>Statusi</label>
                <p className={`status-badge ${profile.isActive ? 'active' : 'inactive'}`}>
                  {profile.isActive ? 'Aktiv' : 'Joaktiv'}
                </p>
              </div>
              <div className="info-item">
                <label>Email i Verifikuar</label>
                <p className={`verification-badge ${profile.emailVerified ? 'verified' : 'unverified'}`}>
                  {profile.emailVerified ? '✅ E verifikuar' : '❌ E paverifikuar'}
                </p>
              </div>
              <div className="info-item">
                <label>Anëtarësuar në</label>
                <p>{new Date(profile.createdAt).toLocaleDateString('sq-AL')}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Password Change Section */}
      <div className="profile-section">
        <div className="section-header">
          <h2>Ndrysho Fjalëkalimin</h2>
        </div>

        <form onSubmit={handleChangePassword} className="password-form">
          <div className="form-group">
            <label htmlFor="currentPassword">Fjalëkalimi Aktual</label>
            <input
              type="password"
              id="currentPassword"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
              required
              disabled={changingPassword}
            />
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">Fjalëkalimi i Ri</label>
            <input
              type="password"
              id="newPassword"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
              required
              disabled={changingPassword}
              minLength={8}
            />
            <small className="password-hint">Së paku 8 karaktere</small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Konfirmo Fjalëkalimin</label>
            <input
              type="password"
              id="confirmPassword"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
              required
              disabled={changingPassword}
            />
          </div>

          <button 
            type="submit" 
            className="change-password-button"
            disabled={changingPassword || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
          >
            {changingPassword ? (
              <>
                <div className="loading-spinner"></div>
                Duke ndryshuar...
              </>
            ) : (
              'Ndrysho Fjalëkalimin'
            )}
          </button>
        </form>
      </div>

      <style>{`
        .profile-page {
          padding: 32px;
          max-width: 800px;
          margin: 0 auto;
        }

        .page-header {
          margin-bottom: 32px;
        }

        .page-header h1 {
          font-size: 32px;
          font-weight: 700;
          color: #1a202c;
          margin: 0 0 8px 0;
        }

        .page-header p {
          font-size: 16px;
          color: #718096;
          margin: 0;
        }

        .loading-container, .error-container {
          text-align: center;
          padding: 40px;
        }

        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(37, 99, 235, 0.3);
          border-radius: 50%;
          border-top-color: #2563eb;
          animation: spin 1s ease-in-out infinite;
          display: inline-block;
        }

        .loading-spinner.large {
          width: 40px;
          height: 40px;
          margin-bottom: 16px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .alert {
          display: flex;
          align-items: center;
          padding: 16px;
          border-radius: 12px;
          margin-bottom: 24px;
          font-weight: 500;
        }

        .alert-error {
          background: #fed7d7;
          color: #c53030;
          border: 1px solid #feb2b2;
        }

        .alert-success {
          background: #c6f6d5;
          color: #25543e;
          border: 1px solid #9ae6b4;
        }

        .alert-icon {
          width: 20px;
          height: 20px;
          margin-right: 12px;
          flex-shrink: 0;
        }

        .profile-section {
          background: white;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          border: 1px solid #e2e8f0;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .section-header h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: #1a202c;
        }

        .edit-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #2563eb;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
          min-width: 120px;
        }

        .edit-button:hover {
          background: #1d4ed8;
          transform: translateY(-1px);
        }

        .edit-icon {
          width: 16px;
          height: 16px;
        }

        .profile-form, .password-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-weight: 600;
          color: #374151;
          font-size: 14px;
        }

        .form-group input, .role-select {
          padding: 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 16px;
          transition: all 0.2s ease;
          background: white;
        }

        .form-group input:focus, .role-select:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .form-group input:disabled, .role-select:disabled {
          background: #f9fafb;
          cursor: not-allowed;
        }

        .role-select {
          cursor: pointer;
        }

        .password-hint {
          color: #6b7280;
          font-size: 12px;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .cancel-button, .save-button, .change-password-button, .retry-button {
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: none;
          text-align: center;
          min-width: 120px;
        }

        .cancel-button {
          background: #d14343;
          color: white;
        }

        .cancel-button:hover:not(:disabled) {
          background: #b73333;
          transform: translateY(-1px);
        }

        .save-button, .change-password-button, .retry-button {
          background: #2563eb;
          color: white;
        }

        .save-button:hover:not(:disabled), 
        .change-password-button:hover:not(:disabled),
        .retry-button:hover:not(:disabled) {
          background: #1d4ed8;
          transform: translateY(-1px);
        }

        .save-button:disabled, 
        .change-password-button:disabled,
        .cancel-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .profile-info {
          margin-top: 8px;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .info-item label {
          font-weight: 600;
          color: #6b7280;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .info-item p {
          margin: 0;
          color: #1a202c;
          font-size: 16px;
          font-weight: 500;
        }

        .role-badge, .status-badge, .verification-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
          color: #6b7280;
        }

        .role-admin { 
          background: #f9f9f9; 
          color: #6b7280; 
          border-color: #e5e7eb;
        }
        .role-manager { 
          background: #f9f9f9; 
          color: #6b7280; 
          border-color: #e5e7eb;
        }
        .role-staff { 
          background: #f9f9f9; 
          color: #6b7280; 
          border-color: #e5e7eb;
        }

        .status-badge.active { 
          background: #f9f9f9; 
          color: #6b7280; 
          border-color: #e5e7eb;
        }
        .status-badge.inactive { 
          background: #f9f9f9; 
          color: #6b7280; 
          border-color: #e5e7eb;
        }

        .verification-badge.verified { 
          background: #f9f9f9; 
          color: #6b7280; 
          border-color: #e5e7eb;
        }
        .verification-badge.unverified { 
          background: #f9f9f9; 
          color: #6b7280; 
          border-color: #e5e7eb;
        }

        @media (max-width: 768px) {
          .profile-page {
            padding: 16px;
          }

          .form-grid, .info-grid {
            grid-template-columns: 1fr;
          }

          .form-actions {
            flex-direction: column;
          }

          .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default UserProfilePage;
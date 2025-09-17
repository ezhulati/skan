import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'manager' | 'staff';
  venueId: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
}

interface InviteForm {
  email: string;
  fullName: string;
  role: 'admin' | 'manager' | 'staff';
}

const UserManagementPage: React.FC = () => {
  const { auth } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteForm, setInviteForm] = useState<InviteForm>({
    email: '',
    fullName: '',
    role: 'staff'
  });
  const [inviteLoading, setInviteLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`https://api-mkazmlu7ta-ew.a.run.app/v1/users`, {
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Dështoi të ngarkoj përdoruesit');
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Dështoi të ngarkoj përdoruesit');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setInviteLoading(true);
      const response = await fetch(`https://api-mkazmlu7ta-ew.a.run.app/v1/users/invite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(inviteForm)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Dështoi të dërgoj ftesnë');
      }

      const data = await response.json();
      alert(`Ftesa u dërgua me sukses! Token: ${data.inviteToken}`);
      setShowInviteForm(false);
      setInviteForm({ email: '', fullName: '', role: 'staff' });
      fetchUsers(); // Refresh the list
    } catch (error: any) {
      console.error('Error inviting user:', error);
      setError(error.message);
    } finally {
      setInviteLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`https://api-mkazmlu7ta-ew.a.run.app/v1/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (!response.ok) {
        throw new Error('Dështoi të përditësoj statusin e përdoruesit');
      }

      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error updating user status:', error);
      setError('Dështoi të përditësoj statusin e përdoruesit');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  if (loading) {
    return (
      <div className="user-management-page">
        <div className="loading">Duke ngarkuar përdoruesit...</div>
      </div>
    );
  }

  return (
    <div className="user-management-page">
      <div className="page-header">
        <h1>Menaxhimi i Përdoruesve</h1>
        <button
          className="btn-primary"
          onClick={() => setShowInviteForm(true)}
          disabled={auth.user?.role !== 'admin' && auth.user?.role !== 'manager'}
        >
          Fto Përdorues
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)} className="close-btn">×</button>
        </div>
      )}

      {showInviteForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Fto Përdorues të Ri</h2>
              <button onClick={() => setShowInviteForm(false)} className="close-btn">×</button>
            </div>
            <form onSubmit={handleInviteUser} className="invite-form">
              <div className="form-group">
                <label htmlFor="email">Email:</label>
                <input
                  type="email"
                  id="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="fullName">Emri i Plotë:</label>
                <input
                  type="text"
                  id="fullName"
                  value={inviteForm.fullName}
                  onChange={(e) => setInviteForm({ ...inviteForm, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="role">Roli:</label>
                <select
                  id="role"
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as 'admin' | 'manager' | 'staff' })}
                  disabled={auth.user?.role === 'manager'} // Managers can't invite admins
                >
                  <option value="staff">Staf</option>
                  <option value="manager">Menaxher</option>
                  {auth.user?.role === 'admin' && <option value="admin">Administrator</option>}
                </select>
              </div>
              <div className="form-actions">
                <button type="submit" disabled={inviteLoading} className="btn-primary">
                  {inviteLoading ? 'Duke dërguar...' : 'Dërgo Ftesnë'}
                </button>
                <button type="button" onClick={() => setShowInviteForm(false)} className="btn-secondary">
                  Anulo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Emri</th>
              <th>Email</th>
              <th>Roli</th>
              <th>Statusi</th>
              <th>Email i Verifikuar</th>
              <th>Krijuar</th>
              <th>Veprimet</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.fullName}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`role-badge role-${user.role}`}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                    {user.isActive ? 'Aktiv' : 'Joaktiv'}
                  </span>
                </td>
                <td>
                  <span className={`verification-badge ${user.emailVerified ? 'verified' : 'unverified'}`}>
                    {user.emailVerified ? '✓ I verifikuar' : '⚠ I paverifikuar'}
                  </span>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                  <button
                    onClick={() => toggleUserStatus(user.id, user.isActive)}
                    className={`btn-sm ${user.isActive ? 'btn-danger' : 'btn-success'}`}
                    disabled={user.id === auth.user?.id} // Can't deactivate self
                  >
                    {user.isActive ? 'Çaktivizo' : 'Aktivizo'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="empty-state">
            <p>Nuk u gjetën përdorues.</p>
          </div>
        )}
      </div>

      <style>{`
        .user-management-page {
          padding: 20px;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          border-bottom: 1px solid #e0e0e0;
          padding-bottom: 20px;
        }

        .page-header h1 {
          margin: 0;
          color: #2c3e50;
          font-size: 28px;
          font-weight: 600;
        }

        .loading {
          text-align: center;
          padding: 40px;
          font-size: 18px;
          color: #666;
        }

        .error-message {
          background: #fee;
          border: 1px solid #fcc;
          color: #c33;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal {
          background: white;
          border-radius: 12px;
          padding: 0;
          width: 90%;
          max-width: 500px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e0e0e0;
        }

        .modal-header h2 {
          margin: 0;
          color: #2c3e50;
          font-size: 20px;
        }

        .invite-form {
          padding: 24px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
          color: #2c3e50;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.3s ease;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #3498db;
          box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
        }

        .form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 24px;
        }

        .users-table-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .users-table {
          width: 100%;
          border-collapse: collapse;
        }

        .users-table th,
        .users-table td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid #f0f0f0;
        }

        .users-table th {
          background: #f8f9fa;
          font-weight: 600;
          color: #2c3e50;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .users-table td {
          color: #444;
          font-size: 14px;
        }

        .users-table tbody tr:hover {
          background: #f8f9fa;
        }

        .role-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .role-admin {
          background: #e74c3c;
          color: white;
        }

        .role-manager {
          background: #f39c12;
          color: white;
        }

        .role-staff {
          background: #3498db;
          color: white;
        }

        .status-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .status-badge.active {
          background: #d4edda;
          color: #155724;
        }

        .status-badge.inactive {
          background: #f8d7da;
          color: #721c24;
        }

        .verification-badge {
          font-size: 12px;
          font-weight: 500;
        }

        .verification-badge.verified {
          color: #28a745;
        }

        .verification-badge.unverified {
          color: #ffc107;
        }

        .btn-primary {
          background: #3498db;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: background-color 0.3s ease;
        }

        .btn-primary:hover {
          background: #2980b9;
        }

        .btn-primary:disabled {
          background: #bdc3c7;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #95a5a6;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: background-color 0.3s ease;
        }

        .btn-secondary:hover {
          background: #7f8c8d;
        }

        .btn-sm {
          padding: 6px 12px;
          border-radius: 4px;
          border: none;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          transition: background-color 0.3s ease;
        }

        .btn-danger {
          background: #e74c3c;
          color: white;
        }

        .btn-danger:hover {
          background: #c0392b;
        }

        .btn-success {
          background: #27ae60;
          color: white;
        }

        .btn-success:hover {
          background: #229954;
        }

        .btn-sm:disabled {
          background: #bdc3c7;
          cursor: not-allowed;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #666;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-btn:hover {
          color: #333;
        }

        .empty-state {
          text-align: center;
          padding: 40px;
          color: #666;
        }

        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
          }

          .users-table-container {
            overflow-x: auto;
          }

          .users-table {
            min-width: 800px;
          }

          .modal {
            width: 95%;
            margin: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default UserManagementPage;
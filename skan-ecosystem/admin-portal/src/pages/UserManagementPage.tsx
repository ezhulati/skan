import React, { useState, useEffect, useCallback } from 'react';
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
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Real API call to fetch users
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api-mkazmlu7ta-ew.a.run.app/v1';
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (auth.token) {
        headers['Authorization'] = `Bearer ${auth.token}`;
      }
      
      // Filter by venue ID for venue-specific user management
      const venueId = 'beach-bar-durres'; // Use same venue as menu management
      const response = await fetch(`${API_BASE_URL}/users?venueId=${venueId}`, {
        headers
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`);
      }
      
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Dështoi të ngarkoj përdoruesit');
    } finally {
      setLoading(false);
    }
  }, [auth.token]);

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setInviteLoading(true);
      
      // Real API call to invite user
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api-mkazmlu7ta-ew.a.run.app/v1';
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (auth.token) {
        headers['Authorization'] = `Bearer ${auth.token}`;
      }
      
      const response = await fetch(`${API_BASE_URL}/users/invite`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: inviteForm.email,
          fullName: inviteForm.fullName,
          role: inviteForm.role,
          venueId: 'beach-bar-durres'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to invite user');
      }
      
      const data = await response.json();
      alert(`✅ Ftesa u dërgua me sukses! Tokeni i ftesës: ${data.inviteToken} (në dev mode)`);
      
      setShowInviteForm(false);
      setInviteForm({ email: '', fullName: '', role: 'staff' });
      
      // Refresh user list
      await fetchUsers();
    } catch (error: any) {
      console.error('Error inviting user:', error);
      setError(error.message);
    } finally {
      setInviteLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api-mkazmlu7ta-ew.a.run.app/v1';
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (auth.token) {
        headers['Authorization'] = `Bearer ${auth.token}`;
      }
      
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          isActive: !currentStatus
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user status');
      }
      
      // Update local state
      const user = users.find(u => u.id === userId);
      if (user) {
        const action = currentStatus ? 'çaktivizuar' : 'aktivizuar';
        const newUsers = users.map(u => 
          u.id === userId ? { ...u, isActive: !currentStatus } : u
        );
        setUsers(newUsers);
        
        alert(`✅ Përdoruesi "${user.fullName}" u ${action} me sukses!`);
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      setError('Dështoi të përditësoj statusin e përdoruesit');
    }
  };

  const handleEditUser = async (updatedRole: string) => {
    if (!editingUser) return;
    
    setEditLoading(true);
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api-mkazmlu7ta-ew.a.run.app/v1';
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (auth.token) {
        headers['Authorization'] = `Bearer ${auth.token}`;
      }
      
      const response = await fetch(`${API_BASE_URL}/users/${editingUser.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          role: updatedRole
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user role');
      }
      
      // Update local state
      const newUsers = users.map(u => 
        u.id === editingUser.id ? { ...u, role: updatedRole as 'admin' | 'manager' | 'staff' } : u
      );
      setUsers(newUsers);
      
      alert(`✅ Roli i përdoruesit "${editingUser.fullName}" u ndryshua në "${updatedRole}" me sukses!`);
      setEditingUser(null);
      
    } catch (error: any) {
      console.error('Error updating user role:', error);
      setError(error.message);
    } finally {
      setEditLoading(false);
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
        <div className="header-title">
          <h1>Menaxhimi i Përdoruesve</h1>
          <div className="demo-badge">
            <span>🎭 DEMO MODE</span>
            <span className="demo-tooltip">Këto janë të dhëna shembull - në përdorim real do të shihni stafin tuaj aktual</span>
          </div>
        </div>
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

      {editingUser && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Ndrysho Rolin e Përdoruesit</h3>
              <button onClick={() => setEditingUser(null)} className="close-btn">×</button>
            </div>
            <div className="edit-user-content">
              <div className="user-info-display">
                <p><strong>Emri:</strong> {editingUser.fullName}</p>
                <p><strong>Email:</strong> {editingUser.email}</p>
                <p><strong>Roli Aktual:</strong> <span className={`role-badge role-${editingUser.role}`}>
                  {editingUser.role === 'admin' ? 'Administrator' :
                   editingUser.role === 'manager' ? 'Menaxher' : 'Staf'}
                </span></p>
              </div>
              
              <div className="role-selection">
                <h4>Zgjidh rolin e ri:</h4>
                <div className="role-options">
                  {['staff', 'manager', 'admin'].map(role => (
                    <button
                      key={role}
                      onClick={() => handleEditUser(role)}
                      disabled={editLoading || role === editingUser.role}
                      className={`role-option ${role === editingUser.role ? 'current' : ''}`}
                    >
                      {editLoading ? 'Duke ndryshuar...' : (
                        role === 'admin' ? '👑 Administrator' :
                        role === 'manager' ? '👔 Menaxher' : '👤 Staf'
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  onClick={() => setEditingUser(null)} 
                  className="btn-secondary"
                  disabled={editLoading}
                >
                  Anulo
                </button>
              </div>
            </div>
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
                  <div className="user-actions">
                    {(auth.user?.role === 'admin' || auth.user?.role === 'manager') && (
                      <button
                        onClick={() => setEditingUser(user)}
                        className="btn-sm btn-edit"
                        title="Ndrysho rolin"
                      >
                        ✏️
                      </button>
                    )}
                    <button
                      onClick={() => toggleUserStatus(user.id, user.isActive)}
                      className={`btn-sm ${user.isActive ? 'btn-danger' : 'btn-success'}`}
                      disabled={user.id === auth.user?.id} // Can't deactivate self
                    >
                      {user.isActive ? 'Çaktivizo' : 'Aktivizo'}
                    </button>
                  </div>
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

        .header-title {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .page-header h1 {
          margin: 0;
          color: #2c3e50;
          font-size: 28px;
          font-weight: 600;
        }

        .demo-badge {
          position: relative;
          display: inline-flex;
          align-items: center;
          background: linear-gradient(135deg, #ff6b6b 0%, #ffa500 100%);
          color: white;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
          cursor: help;
          animation: pulse 2s infinite;
          width: fit-content;
        }

        .demo-badge .demo-tooltip {
          position: absolute;
          top: 100%;
          left: 0;
          margin-top: 8px;
          background: #2c3e50;
          color: white;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 400;
          text-transform: none;
          letter-spacing: normal;
          white-space: nowrap;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
          z-index: 1000;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .demo-badge:hover .demo-tooltip {
          opacity: 1;
          visibility: visible;
          transform: translateY(2px);
        }

        .demo-badge .demo-tooltip::before {
          content: '';
          position: absolute;
          top: -5px;
          left: 20px;
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-bottom: 5px solid #2c3e50;
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
            box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 4px 16px rgba(255, 107, 107, 0.5);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
          }
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
        
        .user-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .btn-edit {
          background: #f39c12;
          color: white;
          font-size: 12px;
          padding: 4px 8px;
          min-width: 32px;
        }

        .btn-edit:hover {
          background: #e67e22;
        }

        .edit-user-content {
          padding: 20px 0;
        }

        .user-info-display {
          background: #f8f9fa;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .user-info-display p {
          margin: 8px 0;
          color: #2c3e50;
        }

        .role-selection h4 {
          margin: 0 0 16px 0;
          color: #2c3e50;
          font-size: 16px;
        }

        .role-options {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
          margin-bottom: 20px;
        }

        .role-option {
          padding: 12px 16px;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 14px;
          font-weight: 500;
          text-align: center;
        }

        .role-option:hover:not(:disabled) {
          border-color: #3498db;
          background: #f8f9fa;
          transform: translateY(-1px);
        }

        .role-option.current {
          border-color: #2ecc71;
          background: #d5f4e6;
          color: #27ae60;
        }

        .role-option:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding-top: 16px;
          border-top: 1px solid #e9ecef;
        }

        @media (max-width: 768px) {
          .role-options {
            grid-template-columns: 1fr;
          }
          
          .user-actions {
            flex-direction: column;
            gap: 4px;
          }
        }

      `}</style>
    </div>
  );
};

export default UserManagementPage;